const data = require("../fe_assesment.json");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const fs = require("fs");
const path = require("path");

const GROUND_TRUTH = "ground_truth";

let rawData = [];

for (const task of data) {
  for (const annotation of task.annotations) {
    if (annotation.completed_by === GROUND_TRUTH) continue;
    if (annotation.last_action === "submitted") {
      rawData.push({
        id: task.id,
        leadTime: annotation.lead_time,
        taskId: task.id,
        userId: annotation.completed_by,
        agreementScore: task.agreement,
      });
    }
  }
}

let dataRows = [];
let usersMap = new Map();

let totalLeadTime = 0;

for (const user of rawData) {
  const id = user.userId;
  if (!usersMap.has(id)) {
    usersMap.set(user.userId, {
      leadTimes: [user.leadTime],
      agreements: [user.agreementScore],
      tasks: 1,
    });
  } else {
    const existing = usersMap.get(id);
    usersMap.set(user.userId, {
      leadTimes: [...existing.leadTimes, user.leadTime],
      agreements: [...existing.agreements, user.agreementScore],
      tasks: existing.tasks + 1,
    });
  }
  totalLeadTime += user.leadTime;
}

const averagePerProject = totalLeadTime / rawData.length;

usersMap.forEach((stats, userId) => {
  let leadSum = 0;
  stats.leadTimes.forEach((el) => {
    leadSum += el;
  });
  const avgLeadTime = (leadSum / stats.tasks).toFixed(2);

  let agreeSum = 0;
  stats.agreements.forEach((el) => {
    agreeSum += el;
  });
  const avgAgreement = (agreeSum / stats.tasks).toFixed(2);

  const comparison = (
    ((avgLeadTime - averagePerProject) / averagePerProject) *
    100
  ).toFixed(2);

  dataRows.push({
    userId,
    averageLeadTime: `${avgLeadTime}s`,
    averageComparisionTime: `${comparison}%`,
    tasksCompleted: stats.tasks,
    averageAgreementScore: `${avgAgreement}%`,
  });
});

const csvWriter = createCsvWriter({
  path: path.join(__dirname, "../outputs/user_performance.csv"),
  header: [
    { id: "userId", title: "User ID" },
    { id: "averageLeadTime", title: "Avg Time per Annotation (s)" },
    {
      id: "averageComparisionTime",
      title: "Time Comparison to Project Avg (%)",
    },
    { id: "tasksCompleted", title: "Completed Tasks" },
    { id: "averageAgreementScore", title: "Total Agreement Score (%)" },
  ],
});

fs.writeFileSync(
  path.join(__dirname, "../outputs/user_performance.json"),
  JSON.stringify(dataRows, null, 2)
);

console.log(
  "Success: JSON export finished → user_performance.json saved in the outputs folder"
);

csvWriter
  .writeRecords(dataRows)
  .then(() =>
    console.log(
      "Success: CSV export finished → user_performance.csv saved in the outputs folder"
    )
  );
