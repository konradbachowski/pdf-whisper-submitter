import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }

  try {
    const { token } = await req.json()
    
    if (!token) {
      throw new Error('Missing reCAPTCHA token')
    }

    const secret = Deno.env.get('RECAPTCHA_SECRET')
    if (!secret) {
      throw new Error('reCAPTCHA secret not configured')
    }

    const verifyRes = await fetch(
      'https://www.google.com/recaptcha/api/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          secret,
          response: token
        })
      }
    )

    const verifyData = await verifyRes.json()

    return new Response(
      JSON.stringify(verifyData),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      }
    )
  }
}) 