import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../config/database';

/**
 * Get all RCA investigations with filters
 */
export const getRCAList = (req: AuthRequest, res: Response) => {
  try {
    const { status, assigned_to, asset_id, severity, method } = req.query;

    let query = `
      SELECT
        rca.*,
        u1.full_name as initiated_by_name,
        u2.full_name as assigned_to_name,
        u3.full_name as approved_by_name,
        a.name as asset_name,
        a.asset_tag,
        wo.title as work_order_title,
        (SELECT COUNT(*) FROM rca_recommended_actions WHERE rca_id = rca.id) as action_count,
        (SELECT COUNT(*) FROM rca_recommended_actions WHERE rca_id = rca.id AND status = 'completed') as completed_action_count
      FROM root_cause_analysis rca
      LEFT JOIN users u1 ON rca.initiated_by = u1.id
      LEFT JOIN users u2 ON rca.assigned_to = u2.id
      LEFT JOIN users u3 ON rca.approved_by = u3.id
      LEFT JOIN assets a ON rca.asset_id = a.id
      LEFT JOIN work_orders wo ON rca.work_order_id = wo.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (status) {
      query += ` AND rca.status = ?`;
      params.push(status);
    }

    if (assigned_to) {
      query += ` AND rca.assigned_to = ?`;
      params.push(assigned_to);
    }

    if (asset_id) {
      query += ` AND rca.asset_id = ?`;
      params.push(asset_id);
    }

    if (severity) {
      query += ` AND rca.severity = ?`;
      params.push(severity);
    }

    if (method) {
      query += ` AND rca.analysis_method = ?`;
      params.push(method);
    }

    query += ` ORDER BY rca.created_at DESC`;

    const investigations = db.prepare(query).all(...params);
    res.json(investigations);
  } catch (error) {
    console.error('Get RCA list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get single RCA investigation with all related data
 */
export const getRCADetail = (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Get main RCA data
    const rca = db.prepare(`
      SELECT
        rca.*,
        u1.full_name as initiated_by_name, u1.email as initiated_by_email,
        u2.full_name as assigned_to_name, u2.email as assigned_to_email,
        u3.full_name as approved_by_name,
        a.name as asset_name, a.asset_tag, a.category as asset_category,
        wo.title as work_order_title, wo.id as work_order_id,
        tf.description as trip_feedback_description
      FROM root_cause_analysis rca
      LEFT JOIN users u1 ON rca.initiated_by = u1.id
      LEFT JOIN users u2 ON rca.assigned_to = u2.id
      LEFT JOIN users u3 ON rca.approved_by = u3.id
      LEFT JOIN assets a ON rca.asset_id = a.id
      LEFT JOIN work_orders wo ON rca.work_order_id = wo.id
      LEFT JOIN trip_feedback tf ON rca.trip_feedback_id = tf.id
      WHERE rca.id = ?
    `).get(id);

    if (!rca) {
      return res.status(404).json({ error: 'RCA investigation not found' });
    }

    // Get fishbone data if applicable
    const fishboneData = db.prepare(`
      SELECT * FROM rca_fishbone_data
      WHERE rca_id = ?
      ORDER BY category, severity DESC
    `).all(id);

    // Get 5 whys data if applicable
    const fiveWhysData = db.prepare(`
      SELECT * FROM rca_five_whys
      WHERE rca_id = ?
      ORDER BY why_level ASC
    `).all(id);

    // Get recommended actions
    const actions = db.prepare(`
      SELECT
        ra.*,
        u1.full_name as assigned_to_name,
        u2.full_name as completed_by_name
      FROM rca_recommended_actions ra
      LEFT JOIN users u1 ON ra.assigned_to = u1.id
      LEFT JOIN users u2 ON ra.completed_by = u2.id
      WHERE ra.rca_id = ?
      ORDER BY ra.priority DESC, ra.created_at ASC
    `).all(id);

    // Get timeline
    const timeline = db.prepare(`
      SELECT
        t.*,
        u.full_name as user_name
      FROM rca_timeline t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.rca_id = ?
      ORDER BY t.created_at DESC
    `).all(id);

    // Get attachments
    const attachments = db.prepare(`
      SELECT * FROM attachments
      WHERE rca_id = ?
      ORDER BY created_at DESC
    `).all(id);

    // Get linked failure patterns
    const failurePatterns = db.prepare(`
      SELECT
        fp.*,
        fpl.contribution_score
      FROM failure_patterns fp
      INNER JOIN failure_pattern_rca_link fpl ON fp.id = fpl.failure_pattern_id
      WHERE fpl.rca_id = ?
    `).all(id);

    res.json({
      ...(rca as any),
      fishbone_data: fishboneData,
      five_whys_data: fiveWhysData,
      actions,
      timeline,
      attachments,
      failure_patterns: failurePatterns
    });
  } catch (error) {
    console.error('Get RCA detail error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Create new RCA investigation
 */
export const createRCA = (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      description,
      work_order_id,
      asset_id,
      trip_feedback_id,
      analysis_method,
      severity,
      incident_date,
      assigned_to,
      specialist_type
    } = req.body;

    if (!title || !analysis_method || !severity) {
      return res.status(400).json({ error: 'Title, analysis method, and severity are required' });
    }

    const result = db.prepare(`
      INSERT INTO root_cause_analysis (
        title, description, work_order_id, asset_id, trip_feedback_id,
        analysis_method, severity, incident_date, initiated_by, assigned_to, specialist_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title,
      description || null,
      work_order_id || null,
      asset_id || null,
      trip_feedback_id || null,
      analysis_method,
      severity,
      incident_date || null,
      req.user!.id,
      assigned_to || null,
      specialist_type || null
    );

    const rcaId = Number(result.lastInsertRowid);

    // Add timeline event
    db.prepare(`
      INSERT INTO rca_timeline (rca_id, event_type, event_title, event_description, user_id)
      VALUES (?, 'created', 'RCA Investigation Created', ?, ?)
    `).run(rcaId, `Created by ${req.user!.full_name}`, req.user!.id);

    // If assigned, add assignment timeline event
    if (assigned_to) {
      db.prepare(`
        INSERT INTO rca_timeline (rca_id, event_type, event_title, event_description, user_id)
        VALUES (?, 'assigned', 'Investigation Assigned', ?, ?)
      `).run(rcaId, `Assigned to specialist`, req.user!.id);
    }

    res.status(201).json({
      id: rcaId,
      message: 'RCA investigation created successfully'
    });
  } catch (error) {
    console.error('Create RCA error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update RCA investigation
 */
export const updateRCA = (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      status,
      severity,
      assigned_to,
      immediate_cause,
      root_cause,
      contributing_factors,
      estimated_cost_impact,
      actual_cost_impact,
      recurrence_risk
    } = req.body;

    const existing = db.prepare('SELECT * FROM root_cause_analysis WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'RCA investigation not found' });
    }

    db.prepare(`
      UPDATE root_cause_analysis
      SET title = ?, description = ?, status = ?, severity = ?, assigned_to = ?,
          immediate_cause = ?, root_cause = ?, contributing_factors = ?,
          estimated_cost_impact = ?, actual_cost_impact = ?, recurrence_risk = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title || (existing as any).title,
      description,
      status || (existing as any).status,
      severity || (existing as any).severity,
      assigned_to,
      immediate_cause,
      root_cause,
      contributing_factors,
      estimated_cost_impact,
      actual_cost_impact,
      recurrence_risk,
      id
    );

    // Add timeline event if status changed
    if (status && status !== (existing as any).status) {
      db.prepare(`
        INSERT INTO rca_timeline (rca_id, event_type, event_title, event_description, user_id)
        VALUES (?, 'status_changed', 'Status Updated', ?, ?)
      `).run(id, `Status changed from ${(existing as any).status} to ${status}`, req.user!.id);
    }

    res.json({ message: 'RCA investigation updated successfully' });
  } catch (error) {
    console.error('Update RCA error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete RCA investigation
 */
export const deleteRCA = (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM root_cause_analysis WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'RCA investigation not found' });
    }

    db.prepare('DELETE FROM root_cause_analysis WHERE id = ?').run(id);
    res.json({ message: 'RCA investigation deleted successfully' });
  } catch (error) {
    console.error('Delete RCA error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Add fishbone cause
 */
export const addFishboneCause = (req: AuthRequest, res: Response) => {
  try {
    const { rca_id } = req.params;
    const { category, cause, sub_causes, severity, notes } = req.body;

    if (!category || !cause) {
      return res.status(400).json({ error: 'Category and cause are required' });
    }

    const result = db.prepare(`
      INSERT INTO rca_fishbone_data (rca_id, category, cause, sub_causes, severity, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(rca_id, category, cause, sub_causes || null, severity || 1, notes || null, req.user!.id);

    // Add timeline event
    db.prepare(`
      INSERT INTO rca_timeline (rca_id, event_type, event_title, event_description, user_id)
      VALUES (?, 'finding_added', 'Fishbone Cause Added', ?, ?)
    `).run(rca_id, `Added ${category} cause: ${cause}`, req.user!.id);

    res.status(201).json({ id: Number(result.lastInsertRowid), message: 'Fishbone cause added' });
  } catch (error) {
    console.error('Add fishbone cause error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update fishbone cause
 */
export const updateFishboneCause = (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { cause, sub_causes, severity, notes } = req.body;

    db.prepare(`
      UPDATE rca_fishbone_data
      SET cause = ?, sub_causes = ?, severity = ?, notes = ?
      WHERE id = ?
    `).run(cause, sub_causes, severity, notes, id);

    res.json({ message: 'Fishbone cause updated successfully' });
  } catch (error) {
    console.error('Update fishbone cause error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete fishbone cause
 */
export const deleteFishboneCause = (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM rca_fishbone_data WHERE id = ?').run(id);
    res.json({ message: 'Fishbone cause deleted successfully' });
  } catch (error) {
    console.error('Delete fishbone cause error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Add 5 Whys question/answer
 */
export const addFiveWhys = (req: AuthRequest, res: Response) => {
  try {
    const { rca_id } = req.params;
    const { why_level, question, answer, is_root_cause, evidence } = req.body;

    if (!why_level || !question || !answer) {
      return res.status(400).json({ error: 'Why level, question, and answer are required' });
    }

    const result = db.prepare(`
      INSERT INTO rca_five_whys (rca_id, why_level, question, answer, is_root_cause, evidence, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(rca_id, why_level, question, answer, is_root_cause ? 1 : 0, evidence || null, req.user!.id);

    // Add timeline event
    db.prepare(`
      INSERT INTO rca_timeline (rca_id, event_type, event_title, event_description, user_id)
      VALUES (?, 'finding_added', '5 Whys Analysis Updated', ?, ?)
    `).run(rca_id, `Added Why #${why_level}: ${answer}`, req.user!.id);

    res.status(201).json({ id: Number(result.lastInsertRowid), message: '5 Whys entry added' });
  } catch (error) {
    console.error('Add 5 whys error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update 5 Whys entry
 */
export const updateFiveWhys = (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { question, answer, is_root_cause, evidence } = req.body;

    db.prepare(`
      UPDATE rca_five_whys
      SET question = ?, answer = ?, is_root_cause = ?, evidence = ?
      WHERE id = ?
    `).run(question, answer, is_root_cause ? 1 : 0, evidence, id);

    res.json({ message: '5 Whys entry updated successfully' });
  } catch (error) {
    console.error('Update 5 whys error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete 5 Whys entry
 */
export const deleteFiveWhys = (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM rca_five_whys WHERE id = ?').run(id);
    res.json({ message: '5 Whys entry deleted successfully' });
  } catch (error) {
    console.error('Delete 5 whys error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Add recommended action
 */
export const addRecommendedAction = (req: AuthRequest, res: Response) => {
  try {
    const { rca_id } = req.params;
    const { action_type, description, priority, assigned_to, due_date, estimated_cost } = req.body;

    if (!action_type || !description || !priority) {
      return res.status(400).json({ error: 'Action type, description, and priority are required' });
    }

    const result = db.prepare(`
      INSERT INTO rca_recommended_actions (
        rca_id, action_type, description, priority, assigned_to, due_date, estimated_cost
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(rca_id, action_type, description, priority, assigned_to || null, due_date || null, estimated_cost || null);

    // Add timeline event
    db.prepare(`
      INSERT INTO rca_timeline (rca_id, event_type, event_title, event_description, user_id)
      VALUES (?, 'action_proposed', 'Recommended Action Added', ?, ?)
    `).run(rca_id, `${action_type} action: ${description}`, req.user!.id);

    res.status(201).json({ id: Number(result.lastInsertRowid), message: 'Recommended action added' });
  } catch (error) {
    console.error('Add recommended action error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update recommended action
 */
export const updateRecommendedAction = (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      description, priority, assigned_to, due_date, estimated_cost,
      actual_cost, status, completion_notes
    } = req.body;

    const existing = db.prepare('SELECT * FROM rca_recommended_actions WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Action not found' });
    }

    db.prepare(`
      UPDATE rca_recommended_actions
      SET description = ?, priority = ?, assigned_to = ?, due_date = ?,
          estimated_cost = ?, actual_cost = ?, status = ?, completion_notes = ?,
          completed_by = ?, completed_at = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      description || (existing as any).description,
      priority || (existing as any).priority,
      assigned_to,
      due_date,
      estimated_cost,
      actual_cost,
      status || (existing as any).status,
      completion_notes,
      status === 'completed' ? req.user!.id : null,
      status === 'completed' ? new Date().toISOString() : null,
      id
    );

    res.json({ message: 'Recommended action updated successfully' });
  } catch (error) {
    console.error('Update recommended action error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete recommended action
 */
export const deleteRecommendedAction = (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM rca_recommended_actions WHERE id = ?').run(id);
    res.json({ message: 'Recommended action deleted successfully' });
  } catch (error) {
    console.error('Delete recommended action error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Approve RCA investigation
 */
export const approveRCA = (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    const existing = db.prepare('SELECT * FROM root_cause_analysis WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'RCA investigation not found' });
    }

    db.prepare(`
      UPDATE root_cause_analysis
      SET status = 'approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.user!.id, id);

    // Add timeline event
    db.prepare(`
      INSERT INTO rca_timeline (rca_id, event_type, event_title, event_description, user_id)
      VALUES (?, 'approved', 'RCA Approved', ?, ?)
    `).run(id, comments || `Approved by ${req.user!.full_name}`, req.user!.id);

    res.json({ message: 'RCA investigation approved successfully' });
  } catch (error) {
    console.error('Approve RCA error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Close RCA investigation
 */
export const closeRCA = (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { closure_notes } = req.body;

    const existing = db.prepare('SELECT * FROM root_cause_analysis WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'RCA investigation not found' });
    }

    db.prepare(`
      UPDATE root_cause_analysis
      SET status = 'closed', closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);

    // Add timeline event
    db.prepare(`
      INSERT INTO rca_timeline (rca_id, event_type, event_title, event_description, user_id)
      VALUES (?, 'closed', 'RCA Closed', ?, ?)
    `).run(id, closure_notes || `Closed by ${req.user!.full_name}`, req.user!.id);

    res.json({ message: 'RCA investigation closed successfully' });
  } catch (error) {
    console.error('Close RCA error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get RCA statistics/dashboard data
 */
export const getRCAStatistics = (req: AuthRequest, res: Response) => {
  try {
    const totalInvestigations = db.prepare('SELECT COUNT(*) as count FROM root_cause_analysis').get() as { count: number };
    const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM root_cause_analysis GROUP BY status').all();
    const bySeverity = db.prepare('SELECT severity, COUNT(*) as count FROM root_cause_analysis GROUP BY severity').all();
    const byMethod = db.prepare('SELECT analysis_method, COUNT(*) as count FROM root_cause_analysis GROUP BY analysis_method').all();

    const totalCostImpact = db.prepare('SELECT SUM(actual_cost_impact) as total FROM root_cause_analysis WHERE actual_cost_impact IS NOT NULL').get() as { total: number };

    const topFailurePatterns = db.prepare(`
      SELECT * FROM failure_patterns
      ORDER BY occurrence_count DESC
      LIMIT 10
    `).all();

    const recentInvestigations = db.prepare(`
      SELECT
        rca.id, rca.title, rca.status, rca.severity, rca.created_at,
        a.name as asset_name,
        u.full_name as assigned_to_name
      FROM root_cause_analysis rca
      LEFT JOIN assets a ON rca.asset_id = a.id
      LEFT JOIN users u ON rca.assigned_to = u.id
      ORDER BY rca.created_at DESC
      LIMIT 10
    `).all();

    const pendingActions = db.prepare(`
      SELECT COUNT(*) as count
      FROM rca_recommended_actions
      WHERE status IN ('pending', 'in_progress')
    `).get() as { count: number };

    res.json({
      total_investigations: totalInvestigations.count,
      by_status: byStatus,
      by_severity: bySeverity,
      by_method: byMethod,
      total_cost_impact: totalCostImpact.total || 0,
      top_failure_patterns: topFailurePatterns,
      recent_investigations: recentInvestigations,
      pending_actions: pendingActions.count
    });
  } catch (error) {
    console.error('Get RCA statistics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get failure patterns
 */
export const getFailurePatterns = (req: AuthRequest, res: Response) => {
  try {
    const patterns = db.prepare(`
      SELECT
        fp.*,
        (SELECT COUNT(*) FROM failure_pattern_rca_link WHERE failure_pattern_id = fp.id) as linked_rca_count
      FROM failure_patterns fp
      ORDER BY fp.occurrence_count DESC, fp.last_occurrence DESC
    `).all();

    res.json(patterns);
  } catch (error) {
    console.error('Get failure patterns error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Link RCA to failure pattern
 */
export const linkToFailurePattern = (req: AuthRequest, res: Response) => {
  try {
    const { rca_id, pattern_id, contribution_score } = req.body;

    if (!rca_id || !pattern_id) {
      return res.status(400).json({ error: 'RCA ID and Pattern ID are required' });
    }

    db.prepare(`
      INSERT OR REPLACE INTO failure_pattern_rca_link (failure_pattern_id, rca_id, contribution_score)
      VALUES (?, ?, ?)
    `).run(pattern_id, rca_id, contribution_score || 1);

    // Update pattern statistics
    db.prepare(`
      UPDATE failure_patterns
      SET occurrence_count = occurrence_count + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(pattern_id);

    res.json({ message: 'RCA linked to failure pattern successfully' });
  } catch (error) {
    console.error('Link to failure pattern error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
