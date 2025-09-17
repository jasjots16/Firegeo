# Troubleshooting Guide

This guide helps resolve common issues in the FireGeo application.

## Common Errors

### 1. OpenAI API Quota Exceeded

**Error Message**: `You exceeded your current quota, please check your plan and billing details`

**Symptoms**:
- AI extraction fails during web scraping
- Error occurs in `/api/brand-monitor/scrape` endpoint

**Solutions**:
1. **Check OpenAI Account**:
   - Visit https://platform.openai.com/usage
   - Check your current usage and billing limits
   - Add more credits or upgrade your plan

2. **Use Alternative AI Providers**:
   - The app supports multiple AI providers (OpenAI, Anthropic, Perplexity)
   - Ensure other providers are configured in `.env.local`:
     ```env
     ANTHROPIC_API_KEY="sk-ant-..."
     PERPLEXITY_API_KEY="pplx-..."
     ```

3. **Provider Fallback**:
   - The app automatically tries other providers if one fails
   - Check provider configuration in `lib/provider-config.ts`

### 2. Database Connection Timeout

**Error Message**: `Connection terminated due to connection timeout`

**Symptoms**:
- Database queries fail
- Error occurs in `/api/brand-monitor/analyses` endpoint
- Connection timeout errors in logs

**Solutions**:
1. **Check Database Connection**:
   - Verify `DATABASE_URL` in `.env.local` is correct
   - Test connection: `GET /api/health`

2. **Network Issues**:
   - Check internet connectivity
   - Verify Neon database is accessible
   - Check for firewall/proxy issues

3. **Database Configuration**:
   - Connection pool settings have been optimized
   - Retry logic is implemented for transient failures

4. **Neon Database Issues**:
   - Check Neon dashboard for service status
   - Verify database isn't suspended (free tier limitation)
   - Consider upgrading to paid tier for better reliability

### 3. No AI Providers Configured Error

**Error Message**: `No AI providers configured and enabled for content extraction`

**Symptoms**:
- AI extraction fails immediately
- Error occurs before trying any providers
- `getConfiguredProviders()` returns empty array

**Root Causes**:
1. **Provider disabled in configuration**: Check `lib/provider-config.ts`
2. **Missing API keys**: Environment variables not set or commented out
3. **Invalid API keys**: Keys are set but invalid/expired

**Solutions**:
1. **Enable Providers**: In `lib/provider-config.ts`, set providers to `true`:
   ```typescript
   export const PROVIDER_ENABLED_CONFIG: Record<string, boolean> = {
     openai: true,      // Enable OpenAI
     anthropic: true,   // Enable Anthropic
     google: true,      // Enable Google
     perplexity: true,  // Enable Perplexity
   };
   ```

2. **Set API Keys**: Uncomment and set valid API keys in `.env.local`:
   ```env
   OPENAI_API_KEY="sk-proj-..."
   ANTHROPIC_API_KEY="sk-ant-..."
   GOOGLE_GENERATIVE_AI_API_KEY="AIza..."
   PERPLEXITY_API_KEY="pplx-..."
   ```

3. **Debug Providers**: Use debug endpoints:
   ```bash
   # Check all provider status
   curl http://localhost:3000/api/debug/providers
   
   # Check health including providers
   curl http://localhost:3000/api/health
   ```

### 4. Analysis Not Saving to Database

**Error**: Scraping works but analysis results are not saved to `brand_analyses` table

**Symptoms**:
- Analysis completes successfully
- Results are displayed in UI
- No entries appear in database
- Sidebar shows "No analyses yet"

**Root Causes**:
1. **Analysis completion callback not triggered**: SSE 'complete' event not received
2. **Save logic conditions not met**: Analysis marked as existing when it's new
3. **Database connection issues**: Save operation fails silently
4. **Authentication issues**: User session not valid during save

**Debug Steps**:
1. **Check Browser Console**: Look for debug messages:
   ```
   [SSE] Analysis complete event received
   [DEBUG] Analysis completed, checking if should save
   [HOOK] Saving analysis data
   ```

2. **Test Database Connection**:
   ```bash
   curl -X POST http://localhost:3000/api/debug/test-save
   ```

3. **Manual Save Test**: In development, use the debug "Manual Save" button

4. **Check Analysis Data Structure**: Ensure all required fields are present:
   ```javascript
   {
     url: string,
     companyName: string,
     industry: string,
     analysisData: object,
     competitors: array,
     prompts: array,
     creditsUsed: number
   }
   ```

**Solutions**:
1. **Verify SSE Connection**: Check if analysis completion event is received
2. **Check Save Conditions**: Ensure `selectedAnalysis` is null for new analyses
3. **Database Retry**: The save operation uses retry logic for connection issues
4. **Session Validation**: Verify user is authenticated during save operation

### 5. Google AI Empty Response Error

**Error Message**: `Google returned empty response` or `Google returned empty response after X attempts`

**Symptoms**:
- Google provider fails with empty response
- Other providers work fine
- Analysis continues with remaining providers

**Root Causes**:
1. **Model Availability**: Requested Google model not available in your region
2. **API Quota**: Google API quota exceeded or billing issues
3. **Prompt Issues**: Certain prompts trigger Google's safety filters
4. **Model Configuration**: Using deprecated or experimental models

**Solutions**:
1. **Test Google Connection**:
   ```bash
   curl http://localhost:3000/api/debug/test-google
   ```

2. **Check Google API Console**:
   - Visit https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com
   - Verify API is enabled and has quota
   - Check billing account status

3. **Model Fallback**: The system now automatically:
   - Uses `gemini-1.5-pro` as default (more stable than `gemini-2.5-pro`)
   - Retries up to 3 times with different parameters
   - Falls back to other providers if Google fails

4. **Manual Model Override**: Update `lib/provider-config.ts`:
   ```typescript
   defaultModel: 'gemini-1.5-flash', // Try faster model
   // or
   defaultModel: 'gemini-pro', // Try older stable model
   ```

5. **Disable Google Temporarily**: In `lib/provider-config.ts`:
   ```typescript
   export const PROVIDER_ENABLED_CONFIG = {
     google: false, // Disable Google
     openai: true,
     anthropic: true,
   };
   ```

**Debug Information**:
Check console for detailed Google error logs including:
- Model used
- Prompt details
- API key status
- Retry attempts

### 6. Firecrawl API Issues

**Error Message**: Various scraping errors

**Solutions**:
1. **Check API Key**:
   - Verify `FIRECRAWL_API_KEY` in `.env.local`
   - Check Firecrawl dashboard for usage limits

2. **Rate Limiting**:
   - Firecrawl has rate limits
   - Implement delays between requests if needed

## Health Check

Use the health check endpoint to diagnose issues:

```bash
curl http://localhost:3000/api/health
```

Response includes:
- Database connectivity status
- AI provider configuration status
- Overall system health

## Configuration Verification

### Environment Variables

Ensure these are set in `.env.local`:

```env
# Database
DATABASE_URL="postgresql://..."

# AI Providers (at least one required)
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
PERPLEXITY_API_KEY="pplx-..."

# Firecrawl
FIRECRAWL_API_KEY="fc-..."

# Autumn Billing
AUTUMN_SECRET_KEY="am_sk_..."
```

### Provider Configuration

Check `lib/provider-config.ts` for enabled providers:

```typescript
export const PROVIDER_ENABLED_CONFIG: Record<string, boolean> = {
  openai: true,      // Enable/disable OpenAI
  anthropic: true,   // Enable/disable Anthropic
  google: false,     // Enable/disable Google
  perplexity: true,  // Enable/disable Perplexity
};
```

## Error Monitoring

### Enhanced Logging

The application now includes detailed error logging:
- Provider fallback attempts
- Database retry attempts
- Detailed error context

### Error Types

- `AIProviderError`: AI service issues
- `DatabaseError`: Database connectivity issues
- `DetailedError`: General errors with context

## Performance Optimizations

### Database Connection Pool

Optimized settings in `lib/db/index.ts`:
- Reduced max connections for better management
- Increased connection timeout
- Added keepalive settings
- Retry logic for transient failures

### AI Provider Fallback

Automatic fallback between providers (in priority order):
1. Try Google Gemini first (Priority 1)
2. If quota exceeded or fails, try OpenAI (Priority 2)
3. If still failing, try Anthropic (Priority 3)
4. Finally try Perplexity (Priority 4)
5. Return error only if all providers fail

The priority order can be modified in `lib/provider-config.ts` by updating the `PROVIDER_PRIORITY` configuration.

## Getting Help

1. **Check Logs**: Look for detailed error messages in console
2. **Health Check**: Use `/api/health` endpoint
3. **Provider Status**: Check individual service dashboards
4. **Configuration**: Verify all environment variables are set

## Development Tips

### Local Testing

```bash
# Test database connection
curl http://localhost:3000/api/health

# Test scraping with fallback
curl -X POST http://localhost:3000/api/brand-monitor/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "example.com"}'
```

### Debugging

Enable detailed logging by checking console output for:
- `[DEBUG]` messages for operation flow
- `--- DETAILED ERROR ---` blocks for error analysis
- Provider fallback attempts
- Database retry attempts