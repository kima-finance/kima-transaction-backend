import supertest from 'supertest'
import app from '../app'

export const testServer = supertest(app)
export const testAgent = supertest.agent(app)
