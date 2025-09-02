const data = require("../fe_assesment.json");
const path = require("path");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

const GROUND_TRUTH = "ground_truth";

let dataRows = [];

for (const task of data) {
  for (const annotation of task.annotations) {
    if (annotation.completed_by === GROUND_TRUTH) continue;

    for (const info of annotation.result) {
      let response = null;
      if (info.value.choices) response = info.value.choices.join(", ");
      if (info.value.text)
        response = Array.isArray(info.value.text)
          ? info.value.text.join(", ")
          : info.value.text;

      dataRows.push({
        taskId: task.id,
        taskData: Object.values(task.data)[0],
        userId: annotation.completed_by,
        questionKey: info.from_name,
        responseType: info.type,
        responseValue: response,
      });
    }
  }
}

const csvWriter = createCsvWriter({
  path: path.join(__dirname, "../outputs/annotations.csv"),
  header: [
    { id: "taskId", title: "Task ID" },
    { id: "taskData", title: "Task Data" },
    { id: "userId", title: "User ID" },
    { id: "questionKey", title: "Question Key" },
    { id: "responseType", title: "Response Type" },
    { id: "responseValue", title: "Response" },
  ],
});

csvWriter
  .writeRecords(dataRows)
  .then(() =>
    console.log(
      "Success: CSV export finished → annotations.csv saved in the outputs folder"
    )
  );
