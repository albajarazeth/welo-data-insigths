# Welo Assessment – Analytics Scripts

## Purpose

This project contains Node.js scripts that generate analytics and reports from Welo annotation data.  
They export results into **CSV** and **JSON** formats so non-technical users and operations teams can easily review the data.

---

## How to Run

### 1. Install dependencies

From the project root, install the required package:

```bash
npm install csv-writer
```

# Run Scripts

### Export annotation responses

```bash
node scripts/annotationsToCsv.js
```

### Export per-user performance analytics

```bash
node scripts/userPerformanceReport.js
```

### Compare user annotations to ground truth

```bash
node scripts/userAccuracyReport.js
```
