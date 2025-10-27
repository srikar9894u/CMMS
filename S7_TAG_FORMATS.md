# S7 Tag Address Format Reference

## Supported Notation

The CMMS S7 service supports both **German** and **English/International** S7 tag notation.

---

## Quick Reference

| Type | German | English | Example |
|------|--------|---------|---------|
| **Input Bit** | E | I | E453.2 or I453.2 |
| **Input Word** | EW | IW | EW10 or IW10 |
| **Input DWord** | ED | ID | ED20 or ID20 |
| **Output Bit** | A | Q | A241.1 or Q241.1 |
| **Output Word** | AW | QW | AW10 or QW10 |
| **Output DWord** | AD | QD | AD20 or QD20 |
| **Memory Bit** | M | M | M0.0 (same in both) |
| **Memory Word** | MW | MW | MW2 (same in both) |
| **Memory DWord** | MD | MD | MD4 (same in both) |
| **Data Block** | DB | DB | DB1.DBX0.0 (same in both) |

---

## Detailed Tag Formats

### Inputs (Eingänge)

**Bit Access:**
```
German:  E453.2    (Input byte 453, bit 2)
English: I453.2    (Same meaning)
```

**Word Access (16-bit):**
```
German:  EW10      (Input Word at byte 10)
English: IW10      (Same meaning)
```

**Double Word Access (32-bit):**
```
German:  ED20      (Input Double Word at byte 20)
English: ID20      (Same meaning)
```

---

### Outputs (Ausgänge)

**Bit Access:**
```
German:  A241.1    (Output byte 241, bit 1)
English: Q241.1    (Same meaning)
```

**Word Access (16-bit):**
```
German:  AW10      (Output Word at byte 10)
English: QW10      (Same meaning)
```

**Double Word Access (32-bit):**
```
German:  AD20      (Output Double Word at byte 20)
English: QD20      (Same meaning)
```

---

### Memory (Merker)

**Bit Access:**
```
M0.0      (Memory byte 0, bit 0) - Same in both languages
M10.5     (Memory byte 10, bit 5)
```

**Word Access (16-bit):**
```
MW2       (Memory Word at byte 2) - Same in both languages
MW100     (Memory Word at byte 100)
```

**Double Word Access (32-bit):**
```
MD4       (Memory Double Word at byte 4) - Same in both languages
MD200     (Memory Double Word at byte 200)
```

---

### Data Blocks (Datenbaustein)

**Bit Access:**
```
DB1.DBX0.0    (Data Block 1, Byte 0, Bit 0)
DB10.DBX5.3   (Data Block 10, Byte 5, Bit 3)
```

**Byte Access:**
```
DB1.DBB0      (Data Block 1, Byte 0)
DB10.DBB5     (Data Block 10, Byte 5)
```

**Word Access (16-bit):**
```
DB1.DBW2      (Data Block 1, Word at byte 2)
DB10.DBW10    (Data Block 10, Word at byte 10)
```

**Double Word Access (32-bit):**
```
DB1.DBD4      (Data Block 1, Double Word at byte 4)
DB10.DBD20    (Data Block 10, Double Word at byte 20)
```

---

## Your Examples

Based on your tags (E453.2, A241.1), you're using German notation:

```
E453.2  =  Input byte 453, bit 2  (German)
A241.1  =  Output byte 241, bit 1  (German)
```

These are automatically converted to:
```
E453.2  →  I453.2  (internally)
A241.1  →  Q241.1  (internally)
```

---

## Usage in CMMS

### Web Interface

1. Go to **S7 PLC Configuration**
2. Add your PLC connection
3. Click **Tags** button
4. In **Tag Address** field, enter **any** of these formats:
   ```
   E453.2        (German)
   I453.2        (English)
   A241.1        (German)
   Q241.1        (English)
   M10.5         (Same in both)
   DB1.DBX0.0    (Data Block)
   ```

### Examples Provided in UI

When you click **(examples)** next to Tag Address, you'll see:
- Data Block Bit: DB1.DBX0.0
- Data Block Word: DB1.DBW2
- Data Block DWord: DB1.DBD4
- Memory (Merker): M0.0, MW2, MD4
- Input - English: I453.2, IW10, ID20
- Input - German: E453.2, EW10, ED20 (Eingang)
- Output - English: Q241.1, QW10, QD20
- Output - German: A241.1, AW10, AD20 (Ausgang)

---

## Common Use Cases

### Motor Status Monitoring

```
Running:  E453.0  or  I453.0
Fault:    E453.1  or  I453.1
Stopped:  E453.2  or  I453.2
```

### Valve Control

```
Open:     A241.0  or  Q241.0
Closed:   A241.1  or  Q241.1
Error:    A241.2  or  Q241.2
```

### Temperature Reading (Word)

```
Temp_1:   EW100   or  IW100
Temp_2:   EW102   or  IW102
```

### Process Data (Data Block)

```
Flow_Rate:     DB10.DBW0
Pressure:      DB10.DBW2
Tank_Level:    DB10.DBW4
```

---

## Technical Notes

### How Conversion Works

The S7 service automatically converts German notation to English before reading:

```python
E453.2  →  I453.2
A241.1  →  Q241.1
EW10    →  IW10
AD20    →  QD20
```

Memory and Data Blocks are the same in both:
```
M0.0       →  M0.0  (no conversion needed)
DB1.DBX0.0 →  DB1.DBX0.0  (no conversion needed)
```

### Backward Compatible

- Existing tags in English notation continue to work
- New tags can use either German or English
- Mix and match as needed
- No migration required

### Case Insensitive

All formats are case-insensitive:
```
e453.2  =  E453.2  =  i453.2  =  I453.2  (all valid)
```

---

## Troubleshooting

### Tag Not Reading

**Check:**
1. PLC is online and connected
2. Tag address exists in PLC program
3. Byte/Bit numbers are correct
4. Data type matches (bit, word, dword)

**Test in CMMS:**
1. Go to S7 PLC Configuration
2. Check connection status (should be "Enabled")
3. View logs: `docker compose logs opc-service`
4. Look for tag read errors

### Invalid Format

Supported formats only:
```
✅ E453.2, I453.2 (with dot)
✅ EW10, IW10 (word)
✅ ED20, ID20 (dword)
❌ E453 (missing bit number)
❌ EX10 (invalid type)
```

---

## Summary

| What You Enter | What It Means | Internally Converts To |
|----------------|---------------|----------------------|
| E453.2 | Input byte 453, bit 2 (German) | I453.2 |
| A241.1 | Output byte 241, bit 1 (German) | Q241.1 |
| I453.2 | Input byte 453, bit 2 (English) | I453.2 (no change) |
| Q241.1 | Output byte 241, bit 1 (English) | Q241.1 (no change) |
| M10.5 | Memory byte 10, bit 5 | M10.5 (no change) |
| DB1.DBX0.0 | Data Block 1, Byte 0, Bit 0 | DB1.DBX0.0 (no change) |

**Use whichever format your team prefers - both work perfectly!**
