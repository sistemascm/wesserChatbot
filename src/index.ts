import { join } from 'path'
import { createBot, createProvider, createFlow, addKeyword, utils } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
//import * as cron from 'cron';
//import * as  https from 'https' ;

//const backendUrl = 'https://wesserchatbot.onrender.com';
//const job = new cron.CronJob('*/14 * * * *', function (){
    // Se ejecuta cada 14 min
//    console.log('restarting server');
    // Crea un htttps GET request para pegarle a la api

 //   https.get(backendUrl, (res) =>{
 //       if (res.statusCode=== 200) {
 //           console.log('Server restarted');
 //       } else {
 //           console.error(`failed to restart server with status code:` + res.statusCode);
 //       }
 //   })
 //   .on('error', (err)=>{
 //       console.error('error during Restart:', err.message);
//    });
//}, null, true );

const PORT = process.env.PORT ?? 3008

const consultaCiudad = addKeyword<Provider, Database>('nuevo')
.addAnswer(['¿Desde qué ciudad te estás comunicando?'],

    { capture: true},
    async (ctx, { gotoFlow, endFlow }) => {
        const texto = ctx.body.toLocaleLowerCase();
        if (!(texto.includes('san') || texto.includes('villa') || texto.includes('empalme')  || texto.includes('pavon')  || texto.includes('arroyo')  || texto.includes('rueda')  || texto.includes('theobald') || texto.includes('fighiera') || texto.includes('godoy') || texto.includes('emilia'))) 
            return endFlow( '❌ Lamentablemente por ahora no tenemos reparto en tu ciudad, pero si esperas un momento un asesor se comunicará contigo. ❌', 
              )

    }
)
.addAnswer(
    ['Excelente, tenemos envío a domicilio en tu ciudad.','Nuestros productos son:','Botellón de Agua de 20L---$3500','Botellón de Agua de 12L---$2500','Dispenser Natural---$7000','Alquiler de Dispensador Frío/Calor---$17000 x mes con 4 Botellones de 20L de regalo'],
)
.addAnswer(["👉 *20* para elegir Botellón de 20L","👉 *12* para elegir Botellón de 12L","👉 *fc* si te interesa alquilar un Frío/Calor"])
.addAnswer(['¿En cuál estás interesado?'],
    { capture: true},
    async (ctx, { fallBack }) => {
        const texto = ctx.body.toLocaleLowerCase();
        if ((!texto.includes('20') && !texto.includes('12') && !texto.includes('fc') )  ) 
           { 
            //console.log('ANDA');
             return fallBack('Disculpa, no comprendo.');
           }
    }
 )
 .addAnswer(
    ['¡Perfecto! Déjanos a continuación tus datos (Apellido, Nombre y tu dirección)','En un momento te vamos a generar un acceso a nuestra app de cliente.','¡Bienvenido a la familia de *Agua Wesser*!']
)

const welcomeFlow = addKeyword<Provider, Database>([ 'hello', 'hola' , 'buen dia' , 'buen día' , 'buenas tardes' , 'buenas noches'])
.addAnswer(`🙌 Hola, soy *Wesser Bot* ¿En qué te puedo ayudar hoy? `)
/* .addAnswer("Escribe alguna de estas opciones:") */
.addAnswer(["Escribe 👉 *nuevo* si eres *nuevo cliente* y quieres información de nuestro servicio,", 'o solamente escríbenos tu consulta a continuación.'].join('\n'),
{ capture: true },
    async (ctx, { endFlow }) => {
        if (!ctx.body.toLocaleLowerCase().includes('nuevo')) {
            return endFlow('Espera un momento por favor. En breve responderemos tu consulta')
        }
        return
    },
    [consultaCiudad]
)

const main = async () => {
    const adapterFlow = createFlow([welcomeFlow])

    
    const adapterProvider = createProvider(Provider)
    const adapterDB = new Database()

    const { handleCtx, httpServer } = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    adapterProvider.server.post(
        '/v1/messages',
        handleCtx(async (bot, req, res) => {
            const { number, message, urlMedia } = req.body
            await bot.sendMessage(number, message, { media: urlMedia ?? null })
            return res.end('sended')
        })
    )

    adapterProvider.server.post(
        '/v1/register',
        handleCtx(async (bot, req, res) => {
            const { number, name } = req.body
            await bot.dispatch('REGISTER_FLOW', { from: number, name })
            return res.end('trigger')
        })
    )

    adapterProvider.server.post(
        '/v1/samples',
        handleCtx(async (bot, req, res) => {
            const { number, name } = req.body
            await bot.dispatch('SAMPLES', { from: number, name })
            return res.end('trigger')
        })
    )

    adapterProvider.server.post(
        '/v1/blacklist',
        handleCtx(async (bot, req, res) => {
            const { number, intent } = req.body
            if (intent === 'remove') bot.blacklist.remove(number)
            if (intent === 'add') bot.blacklist.add(number)

            res.writeHead(200, { 'Content-Type': 'application/json' })
            return res.end(JSON.stringify({ status: 'ok', number, intent }))
        })
    )

    httpServer(+PORT)
}

main()
