# CMMS User Guide

## Getting Started

### First Login
1. Navigate to `http://your-server-ip` in your web browser
2. Use default credentials:
   - **Username:** `admin`
   - **Password:** `admin123`
3. **IMPORTANT:** Change the default password immediately!

---

## Using the System

### Dashboard

The Dashboard is your central hub showing:
- Asset statistics (total, operational, down, in maintenance)
- Work order counts by status
- Preventive maintenance schedule overview
- Inventory status with low stock alerts
- Quick action buttons

---

## Asset Management

### Adding an Asset
1. Click **"Assets"** in the sidebar
2. Click **"+ Add Asset"** button
3. Fill in the required fields:
   - **Name**: Equipment name (e.g., "HVAC Unit 1")
   - **Asset Tag**: Unique identifier (e.g., "AST-001")
   - **Category**: Type of asset (e.g., "HVAC", "Electrical")
4. Optional fields:
   - Location, Manufacturer, Model
   - Serial Number
   - Purchase Date, Warranty Expiry
   - Status (Operational, Down, Maintenance, Retired)
   - Criticality (Low, Medium, High, Critical)
   - Description and Notes
5. Click **"Create Asset"**

### Viewing Assets
- See all assets in a table view
- Filter by status or category
- Click "View Details" to see complete asset information

### Editing Assets
1. Locate the asset in the Assets table
2. Click the **"Edit"** button in the Actions column
3. A form opens with pre-filled data from the existing asset
4. Make your changes to any field
5. Click **"Update Asset"** to save changes
6. Success message confirms the update

### Deleting Assets
1. Locate the asset you want to delete
2. Click the **"Delete"** button in the Actions column
3. A confirmation dialog appears with **"Confirm"** and **"Cancel"** buttons
4. Review the warning message carefully
5. Click **"Confirm"** to permanently delete the asset
6. Note: This action cannot be undone
7. Success message confirms deletion

---

## Work Orders

### Creating a Work Order
1. Click **"Work Orders"** in the sidebar
2. Click **"+ New Work Order"**
3. Fill in details:
   - **Title**: Brief description (required)
   - **Description**: Detailed work description
   - **Asset**: Select which asset needs work (optional)
   - **Assigned To**: Select technician
   - **Work Type**: Corrective, Preventive, Inspection, or Project
   - **Priority**: Low, Medium, High, or Urgent
   - **Estimated Hours**: How long it should take
   - **Scheduled Date**: When work should be done
   - **Notes**: Additional instructions
4. Click **"Create Work Order"**

### Managing Work Orders
- Filter by status (Open, Assigned, In Progress, etc.)
- Filter by priority
- Click "View Details" to see full information
- Update status as work progresses
- Add parts used from inventory

### Editing Work Orders
1. Find the work order in the Work Orders table
2. Click the **"Edit"** button in the Actions column
3. Form opens with current work order details pre-filled
4. Modify any fields as needed
5. Click **"Update Work Order"** to save
6. Success message appears confirming the update

### Deleting Work Orders
1. Locate the work order you want to remove
2. Click the **"Delete"** button in the Actions column
3. Confirmation dialog appears with **"Confirm"** and **"Cancel"** buttons
4. Verify you want to delete this work order
5. Click **"Confirm"** to permanently delete
6. Warning: This action cannot be undone
7. Success message confirms deletion

### Work Order Status Updates
Quick status management with action buttons:

**Start Button:**
1. For work orders in "Open" or "Assigned" status
2. Click the **"Start"** button
3. Status automatically changes to "In Progress"
4. No confirmation needed for quick workflow

**Complete Button:**
1. For work orders in "In Progress" status
2. Click the **"Complete"** button
3. Status automatically changes to "Completed"
4. Work order is marked as finished

These buttons provide faster status updates without opening the edit form.

---

## Preventive Maintenance

### Creating a PM Schedule
1. Click **"Preventive Maintenance"** in the sidebar
2. Click **"+ New Schedule"**
3. Configure the schedule:
   - **Asset**: Which asset needs PM
   - **Task Title**: What needs to be done (e.g., "Monthly Filter Replacement")
   - **Frequency**: Daily, Weekly, Monthly, Quarterly, or Yearly
   - **Every**: Interval number (e.g., "2" for every 2 weeks)
   - **Next Due Date**: When first PM is due
   - **Assigned To**: Select technician
   - **Description**: Detailed instructions
4. Click **"Create Schedule"**

### Completing PM Tasks
1. Find the task in the Preventive Maintenance list
2. Click **"Complete"** button
3. System automatically calculates next due date based on frequency
4. Task is rescheduled for next occurrence

### Editing PM Schedules
1. Locate the PM schedule in the table
2. Click the **"Edit"** button in the Actions column
3. Form displays with current schedule details pre-filled
4. Update any fields (frequency, due date, assigned technician, etc.)
5. Click **"Update Schedule"** to save changes
6. Success message confirms the update

### Deleting PM Schedules
1. Find the PM schedule you want to remove
2. Click the **"Delete"** button in the Actions column
3. Confirmation dialog appears with **"Confirm"** and **"Cancel"** buttons
4. Review the warning carefully
5. Click **"Confirm"** to permanently delete the schedule
6. Note: This action cannot be undone and will remove all future occurrences
7. Success message confirms deletion

### Activating/Deactivating PM Schedules
Control which PM schedules are active without deleting them:

**Deactivate:**
1. Find an active PM schedule (shows as "Active" status)
2. Click the **"Deactivate"** button
3. Schedule is paused and won't appear on the calendar
4. Status changes to "Inactive"
5. Use this to temporarily suspend maintenance without losing the schedule

**Activate:**
1. Find an inactive PM schedule (shows as "Inactive" status)
2. Click the **"Activate"** button
3. Schedule resumes and appears on the calendar again
4. Status changes to "Active"
5. Tasks will be scheduled according to the frequency

This feature is useful for seasonal equipment or when temporarily suspending maintenance activities.

---

## 52-Week PPM Calendar

### Viewing the Calendar
1. Click **"52-Week Calendar"** in the sidebar
2. See all PM tasks organized quarterly
3. Layout structure:
   - **4 Columns**: Q1, Q2, Q3, Q4 (each covering 13 weeks)
   - **4 Rows**: Weekly, Monthly, Quarterly, and Yearly tasks
4. Each quarter shows the week range and dates

### Understanding the Layout
- **Row 1 (Blue)**: Weekly PM tasks scheduled in each quarter
- **Row 2 (Green)**: Monthly PM tasks scheduled in each quarter
- **Row 3 (Yellow)**: Quarterly PM tasks scheduled in each quarter
- **Row 4 (Purple)**: Yearly PM tasks scheduled in each quarter
- **Red highlighting**: Overdue tasks with red background

### Task Cards
Each task card shows:
- Asset name and task title
- Week number (W1-W52) when it's due
- Due date
- Red highlighting if overdue

### Using the Calendar
- Hover over task cards to see full details (asset, task, due date, assigned technician, frequency)
- Use year selector to view different years
- Check summary statistics at bottom
- Review "Upcoming Tasks" section for next 4 weeks
- Plan quarterly maintenance by viewing all tasks in each quarter
- Balance workload by identifying busy quarters

---

## Inventory Management

### Adding Inventory Items
1. Click **"Inventory"** in the sidebar
2. Click **"+ Add Item"**
3. Enter item details:
   - **Part Number**: Unique identifier (required)
   - **Name**: Item name (required)
   - **Category**: Type of part
   - **Unit**: pieces, liters, etc.
   - **Quantity**: Current stock (required)
   - **Minimum Quantity**: Reorder point
   - **Unit Cost**: Price per unit
   - **Location**: Where stored
   - **Supplier**: Vendor name
   - **Description**: Additional details
4. Click **"Add Item"**

### Monitoring Inventory
- Yellow highlighted rows = Low stock (at or below minimum)
- Click "Low Stock Only" to see items needing reorder
- Track quantities and costs
- Update quantities as parts are used

### Editing Inventory Items
1. Find the inventory item in the table
2. Click the **"Edit"** button in the Actions column
3. Form opens with current item details pre-filled
4. Update fields as needed (quantity, cost, supplier, etc.)
5. Click **"Update Item"** to save
6. Success message confirms the update

### Deleting Inventory Items
1. Locate the item you want to remove
2. Click the **"Delete"** button in the Actions column
3. Confirmation dialog appears with **"Confirm"** and **"Cancel"** buttons
4. Verify you want to delete this inventory item
5. Click **"Confirm"** to permanently delete
6. Warning: This action cannot be undone
7. Success message confirms deletion

### Stock Adjustment
Quickly adjust inventory quantities without editing the full item:

1. Find the item that needs a stock adjustment
2. Click the **"Adjust Stock"** button in the Actions column
3. A quick adjustment dialog appears
4. Enter the adjustment:
   - **Add Stock**: Enter positive number (e.g., "+50")
   - **Remove Stock**: Enter negative number (e.g., "-10")
5. Click **"Adjust"** to apply the change
6. New quantity is calculated and saved automatically
7. Success message shows the updated quantity

This feature is ideal for:
- Receiving new stock from suppliers
- Recording parts used in maintenance
- Conducting inventory counts
- Correcting quantity errors

---

## Reports & Analytics

### Viewing Reports
1. Click **"Reports"** in the sidebar
2. Set date range for analysis
3. View visual charts:
   - Asset Status Distribution (pie chart)
   - Work Order Status (bar chart)
   - Work Order Priority Distribution (pie chart)
   - Maintenance Metrics (progress bars)

### Understanding KPIs
- **Work Order Completion Rate**: Percentage of completed vs total
- **Asset Uptime**: Percentage of operational assets
- **PM Compliance**: Percentage of on-time PM tasks

### Recent Work Orders
- See latest 10 work orders in table
- Check status and priority
- Monitor assignments

### Exporting Reports

**CSV Export:**
1. Click the **"Export CSV"** button at the top of the Reports page
2. System generates a CSV file with all report data
3. File downloads automatically to your computer
4. Open in Excel, Google Sheets, or any spreadsheet application
5. Use for further analysis, archiving, or sharing with stakeholders

**Print Reports:**
1. Click the **"Print"** button at the top of the Reports page
2. Browser print dialog opens
3. Select your printer or "Save as PDF"
4. Adjust print settings (orientation, margins, etc.)
5. Click Print to generate hard copy
6. Report includes all charts, tables, and KPIs formatted for printing

Export features are useful for:
- Monthly management reports
- Board presentations
- Compliance documentation
- Historical record keeping
- Budget justification

---

## User Management (Admin/Manager Only)

### Adding Users
1. Click **"Users"** in the sidebar
2. Click **"+ Add User"**
3. Enter user information:
   - **Username**: Login name (required)
   - **Full Name**: Display name
   - **Email**: User email (required)
   - **Password**: Minimum 6 characters (required)
   - **Role**: Select permission level
4. Click **"Create User"**

### User Roles
- **Admin**: Full access, can manage users
- **Manager**: Can manage all maintenance data
- **Technician**: Can update assigned work orders
- **Viewer**: Read-only access

### Editing Users
1. Find the user in the Users table
2. Click the **"Edit"** button in the Actions column
3. Form opens with current user details pre-filled
4. Update any fields as needed:
   - Full Name
   - Email
   - Role
   - Password (optional)
5. **Password Field Handling:**
   - Leave password field **blank** to keep the current password unchanged
   - Enter a new password (minimum 6 characters) only if changing it
   - User can continue using old password if field is left empty
6. Click **"Update User"** to save
7. Success message confirms the update

### Deleting Users
1. Locate the user you want to remove
2. Click the **"Delete"** button in the Actions column
3. Confirmation dialog appears with **"Confirm"** and **"Cancel"** buttons
4. Verify you want to delete this user account
5. Click **"Confirm"** to permanently delete
6. Warning: This action cannot be undone
7. User will be immediately logged out and unable to access the system
8. Success message confirms deletion

**Important Notes:**
- Cannot delete your own account while logged in
- Deleted users' work order assignments remain intact
- Consider deactivating instead of deleting to preserve historical data

---

## Best Practices

### Asset Management
- Use consistent naming conventions for asset tags
- Keep asset information up to date
- Mark assets as "Down" immediately when they fail
- Update asset status when maintenance is complete

### Work Orders
- Create work orders for all maintenance activities
- Use appropriate priority levels (save "Urgent" for emergencies)
- Assign work orders to specific technicians
- Update status as work progresses
- Record actual hours for tracking

### Preventive Maintenance
- Create PM schedules for all critical assets
- Set realistic frequencies based on manufacturer recommendations
- Complete PM tasks on time to avoid overdue status
- Review the 52-week calendar weekly to plan ahead
- Assign PM tasks to technicians in advance

### Inventory
- Set appropriate minimum quantities to avoid stockouts
- Update quantities when parts are used
- Keep supplier information current
- Review low stock items regularly

### Reports
- Check reports weekly for trends
- Monitor KPIs to identify improvement areas
- Use data to justify maintenance budget
- Track completion rates to measure team performance

---

## Tips & Tricks

### Quick Navigation
- Use the sidebar for main navigation
- Click breadcrumbs to go back
- Use browser back button if needed

### Filtering & Searching
- Use status filters to find specific items
- Filter by category for focused views
- Search by entering text in filter fields

### Notifications
- Green success messages appear after creating/updating items
- Red error messages show if something goes wrong
- Messages auto-dismiss after 3 seconds

### 52-Week Calendar Tips
- Compare maintenance load across all four quarters at a glance
- Identify quarters with heavy maintenance schedules
- Use frequency rows to see patterns (e.g., too many monthly tasks in Q2)
- Balance workload by reviewing task distribution across quarters
- Print calendar for quarterly planning meetings

---

## Common Tasks

### Daily Tasks
- Check Dashboard for overdue items
- Review new work orders
- Update work order status
- Complete assigned PM tasks

### Weekly Tasks
- Review 52-week calendar
- Check inventory low stock items
- Assign upcoming work orders
- Monitor open urgent work orders

### Monthly Tasks
- Run reports and review KPIs
- Analyze completion rates
- Review asset status
- Plan preventive maintenance schedule

---

## Troubleshooting

### Can't Login
- Verify username and password
- Check CAPS LOCK is off
- Contact admin to reset password

### Work Order Won't Save
- Ensure all required fields (*) are filled
- Check that asset and technician selections are valid
- Verify date format is correct

### PM Task Not Appearing on Calendar
- Check that schedule is marked as "Active"
- Verify next due date is in the selected year
- Refresh the page

### Inventory Low Stock Not Showing
- Verify current quantity is at or below minimum quantity
- Click "Low Stock Only" button to filter
- Check if filter is applied

---

## Getting Help

For technical support:
1. Check this user guide
2. Review INSTALLATION_GUIDE.md for setup issues
3. Check README.md for detailed documentation
4. Contact your system administrator

---

## Keyboard Shortcuts

- **Tab**: Move to next field in forms
- **Enter**: Submit forms
- **Esc**: Close modal popups
- **Ctrl+R**: Refresh page

---

## Security Tips

1. **Change default password immediately**
2. Use strong passwords (8+ characters, mix of letters/numbers/symbols)
3. Don't share login credentials
4. Log out when finished
5. Admin: Review user access regularly
6. Admin: Remove accounts for departed employees

---

**Remember:** This CMMS is designed to help you work smarter, not harder. Use it consistently for best results!

For questions or feature requests, contact your system administrator.
