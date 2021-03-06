import {FastifyRequest} from "fastify";
import {checkpointContainer, inspectContainer, listContainer} from "../docker";
import {MigrateRequestType} from "../schema";
import {transferContainerImage} from "./transfer";
import {execRsync, findDestinationFileSystemId, waitForIt} from "../lib";
import {FastifyLoggerInstance} from "fastify/types/logger";
import dotenv from "dotenv";
import {readFileSync} from "fs";


async function migrate(request: FastifyRequest<{ Body: MigrateRequestType }>) {
    const containerInfos: any[] = await listContainer(request.log);

    const {checkpointId, interfaceHost, interfacePort, containers, volumes} = request.body;

    const config = dotenv.parse(readFileSync('/etc/podinfo/annotations','utf8'))
    const exit = config[process.env.START_MODE_ANNOTATION!] !== process.env.START_MODE_ACTIVE

    await waitForIt(interfaceHost, interfacePort, request.log)

    const responses = await Promise.all(
        containerInfos
            .map(containerInfo => checkpointContainer(containerInfo.Id, checkpointId, exit, request.log)
                .then(() => transferContainerImage(checkpointId, interfaceHost, interfacePort, containers, containerInfo, request.log)))
            .concat(
                containerInfos.map(containerInfo => transferContainerFileSystem(interfaceHost, interfacePort, containers, containerInfo, request.log)),
                volumes.map(volume => transferVolume(interfaceHost, interfacePort, volume, request.log))
            )
    )
    request.log.info(responses)
}

async function transferContainerFileSystem(interfaceHost: string, interfacePort: string, containers: any, containerInfo: any, log: FastifyLoggerInstance) {
    const {destinationFs} = await findDestinationFileSystemId(containers, containerInfo)

    const {GraphDriver: {Name, Data: {UpperDir}}} = await inspectContainer(containerInfo.Id, log)
    if (Name === 'overlay2' && destinationFs !== null) {
        await execRsync(interfacePort, UpperDir, `rsync@${interfaceHost}:${destinationFs}`.slice(0, -5), log)
    }
}

async function transferVolume(interfaceHost: string, interfacePort: string, volume: any, log: FastifyLoggerInstance) {
    await execRsync(interfacePort, volume, `rsync@${interfaceHost}:/mount`, log)
}

export {migrate}
