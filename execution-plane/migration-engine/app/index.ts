import {FastifyInstance} from "fastify";
import {create} from "./api/create";
import {probe} from "./api/probe";
import {list} from "./api/list";
import {checkpoint} from "./api/checkpoint";
import {transfer} from "./api/transfer";
import {migrate} from "./api/migrate";
import {restore} from "./api/restore";
import {stop} from "./api/stop"
import {
    CreateRequestType,
    MigrateRequestType,
    MigrateRequestSchema,
    CreateRequestSchema,
    BaseRequestType,
    BaseRequestSchema,
    CheckpointRequestType,
    CheckpointRequestSchema
} from "./schema";

function registerPath(server: FastifyInstance) {
    server.get('/', (request, reply) => {
        reply.code(200).send('welcome')
    })
    server.post<{ Params: CreateRequestType }>('/create/:containerName', CreateRequestSchema, create)
    server.get('/list', list)
    server.get<{ Params: CreateRequestType }>('/probe/:containerName', CreateRequestSchema, probe)
    server.post<{ Body: CheckpointRequestType }>('/checkpoint', CheckpointRequestSchema, checkpoint)
    server.post<{ Body: MigrateRequestType }>('/transfer', MigrateRequestSchema, transfer)
    server.post<{ Body: MigrateRequestType }>('/migrate', MigrateRequestSchema, migrate)
    server.post<{ Body: BaseRequestType }>('/restore', BaseRequestSchema, restore)
    server.post('/stop', stop)
}

export {registerPath}
