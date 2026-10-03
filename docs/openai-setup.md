# Optional OpenAI AI mode

Local Qwen 3.5 remains the default. No OpenAI key is included, and cloud requests are disabled.

On the computer running Aster, add these values to the existing private `%LOCALAPPDATA%/Aster/mysql-instance/app.env` file (or set them only in the API server process environment):

```
OPENAI_API_KEY=your-own-key
ASTER_OPENAI_ENABLED=true
```

Keep this file private. Never put the key into the frontend, a VITE variable, a chat message, or source control. Restart the Aster API server after changing it. Use an API project with suitable usage limits; API charges are separate from ChatGPT subscriptions and Aster's preview membership.

The model picker becomes available when the key and explicit enable flag are present. Each chat/review starts with Local AI. Selecting OpenAI requires a visible content-sharing confirmation. Only the submitted conversation, selected course context, or exam pages/text are sent. The app does not silently fall back to cloud AI.

The configured flagship is `gpt-6-astra`, verified against official documentation on 20 September 2026. Chat, course tutoring, and exam review use the Responses API with medium reasoning, no temperature parameter, and `store:false`. Exam review retains a strict JSON schema. This does not reproduce all ChatGPT features, nor guarantee zero provider retention. Model access and billing must be enabled in the API project.

Cloud requests have been tested with a simulated provider response, not a paid live API call. Mock-exam scheduling is deterministic in the Java backend and does not use an AI provider. Chat and exam-image coaching retain the selected provider and never switch automatically.

Sources: [model guidance](https://developers.openai.com/api/docs/guides/latest-model), [structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [API data controls](https://developers.openai.com/api/docs/guides/your-data).
