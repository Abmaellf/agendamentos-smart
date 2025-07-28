	import { z } from 'zod'

    const envSchema = z.object({
        VITE_API_URL: z.string().refine((value) => /^(https?):\/\/(?=.*\.[a-z]{2,})[^\s$.?#].[^\s]*$/i.test(value), {
            message: 'Please enter a valid URL',
        })
    })

    export const env = envSchema.parse(import.meta.env)
    
