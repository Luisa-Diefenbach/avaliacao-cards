/* 
Vocês devem implementar o arquivo server  tambem
*/
import Fastify from 'fastify'

const app = Fastify({logger: true})

app.listen({port:3333}).then(()=>{
    console.log('Server online')
})