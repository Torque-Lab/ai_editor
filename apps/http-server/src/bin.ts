import cluster from "cluster";
import os from "os";
import { app } from "./index";

const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
    console.log(`Master ${process.pid} is running`);
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on("exit", (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`);
    });
} else {
    console.log(`Worker ${process.pid} started`);
    app.listen(3000, () => {
        console.log("Server started on port 3000");
    });
}
