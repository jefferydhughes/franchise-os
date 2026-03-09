import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

export async function GET() {
  const results: Record<string, unknown> = {
    // 1. Env vars
    anthropic_key_set: !!process.env.ANTHROPIC_API_KEY,
    anthropic_key_prefix: process.env.ANTHROPIC_API_KEY?.substring(0, 15) ?? 'missing',
    anthropic_key_length: process.env.ANTHROPIC_API_KEY?.length ?? 0,
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'missing',
    supabase_service_role_set: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    clerk_secret_set: !!process.env.CLERK_SECRET_KEY,
  }

  // 2. Test Supabase connection
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data, error } = await supabase
      .from('brands')
      .select('id, name, slug')
      .eq('slug', 'skill-samurai')
      .maybeSingle()

    console.log('Brand query result:', { data, error })

    results.supabase_ok = !error
    results.supabase_brand = data ?? null
    results.supabase_error = error?.message ?? null
  } catch (e: unknown) {
    results.supabase_ok = false
    results.supabase_error = e instanceof Error ? e.message : String(e)
  }

  // 3. Test Anthropic API
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 20,
      messages: [{ role: 'user', content: 'Say "ok" and nothing else.' }],
    })
    const text = response.content[0]?.type === 'text' ? response.content[0].text : ''
    results.anthropic_ok = true
    results.anthropic_response = text
  } catch (e: unknown) {
    results.anthropic_ok = false
    results.anthropic_error = e instanceof Error ? e.message : String(e)
  }

  return NextResponse.json(results)
}
