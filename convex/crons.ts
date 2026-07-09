import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "cleanup-old-files-every-hour",
  { hours: 1 },
  api.files.cleanupOldFiles
);

export default crons;
