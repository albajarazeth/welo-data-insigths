const data = require("../fe_assesment.json");
const path = require("path");
const fs = require("fs");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

const GROUND_TRUTH = "ground_truth";

let rawData = [];

for (const task of data) {
  for (const annotation of task.annotations) {
    for (const info of annotation.result) {
      let response = null;
      if (info.value.choices) response = info.value.choices.join(", ");
      if (info.value.text)
        response = Array.isArray(info.value.text)
          ? info.value.text.join(", ")
          : info.value.text;

      rawData.push({
        taskId: task.id,
        questionKey: info.from_name,
        responseType: info.type,
        responseValue: response,
        userId: annotation.completed_by,
      });
    }
  }
}

let usersMap = new Map();

for (const user of rawData) {
  const id = user.userId;

  if (!usersMap.has(id)) {
    usersMap.set(id, {
      [user.taskId]: [
        { questionKey: user.questionKey, responseValue: user.responseValue },
      ],
    });
  } else {
    const existing = usersMap.get(id);

    if (!existing[user.taskId]) {
      existing[user.taskId] = [
        { questionKey: user.questionKey, responseValue: user.responseValue },
      ];
    } else {
      existing[user.taskId].push({
        questionKey: user.questionKey,
        responseValue: user.responseValue,
      });
    }

    usersMap.set(id, existing);
  }
}

let accuracyResults = new Map();

usersMap.forEach((tasks, userId) => {
  if (userId === GROUND_TRUTH) return;

  Object.keys(tasks).forEach((taskId) => {
    const groundTruthAnswers = usersMap.get(GROUND_TRUTH)[taskId];
    if (!groundTruthAnswers) return;

    const userAnswers = tasks[taskId];

    let total = 0;
    let matches = 0;

    groundTruthAnswers.forEach((gt) => {
      if (gt.responseValue === "Yes" || gt.responseValue === "No") {
        total++;

        const match = userAnswers.find((u) => u.questionKey === gt.questionKey);
        if (match && match.responseValue === gt.responseValue) {
          matches++;
        }
      }
    });

    const accuracy = total > 0 ? (matches / total) * 100 : null;

    if (!accuracyResults.has(userId)) {
      accuracyResults.set(userId, { tasks: [accuracy] });
    } else {
      const existing = accuracyResults.get(userId);
      existing.tasks.push(accuracy);
      accuracyResults.set(userId, existing);
    }
  });
});

let dataRows = [];

accuracyResults.forEach((stats, userId) => {
  const sum = stats.tasks.reduce((a, b) => a + b, 0);
  const avg = sum / stats.tasks.length;

  dataRows.push({
    userId: userId,
    overallAccuracy: `${avg.toFixed(2)}%`,
  });
});

const csvWriter = createCsvWriter({
  path: path.join(__dirname, "../outputs/user_performance.csv"),
  header: [
    { id: "userId", title: "User ID" },
    { id: "overallAccuracy", title: "Overall Accuracy" },
  ],
});

fs.writeFile(
  path.join(__dirname, "../outputs/user_accuracy.json"),
  JSON.stringify(dataRows, null, 2),
  (err) => {
    if (err) {
      console.error("Error writing JSON:", err);
    } else {
      console.log(
        "Success: JSON export finished → user_accuracy.json saved in the outputs folder"
      );
    }
  }
);

csvWriter
  .writeRecords(dataRows)
  .then(() =>
    console.log(
      "Success: CSV export finished → user_accuracy.csv saved in the outputs folder"
    )
  );
