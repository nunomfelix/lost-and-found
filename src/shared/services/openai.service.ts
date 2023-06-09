import { Injectable } from '@nestjs/common';
import { OpenAIApi, Configuration } from 'openai';
import { ApiConfigService } from './api-config.service';

@Injectable()
export class OpenAiService {
  constructor(private readonly configService: ApiConfigService) {}

  async parseMessage(message: string): Promise<any> {
    const config = new Configuration({
      apiKey: this.configService.openAIConfig.apiKey,
    });

    const openai = new OpenAIApi(config);

    let gptResponse;
    let parsedResponse;
    let hasError;
    let retryCount = 0;
    const maxRetries = 5; // specify the maximum number of retries

    do {
      hasError = false;

      try {
        gptResponse = await openai.createCompletion({
          model: 'text-davinci-003',
          prompt: `I need you to act as a context deriver. I will provide you with a sentence it will be your job to produce a json object of the following keys: type, brand and color based on details from the message. Don't print anything else but the JSON object. The message is '${message}'`,
          max_tokens: 60,
        });

        parsedResponse = JSON.parse(gptResponse.data.choices[0].text.trim());
      } catch (error) {
        hasError = true;
        retryCount++;
        console.error(
          `Failed to parse JSON response. Retry count: ${retryCount}. Error: ${error.message}`,
        );
      }
    } while (hasError && retryCount < maxRetries);

    if (retryCount === maxRetries) {
      throw new Error(
        'Failed to parse JSON response after maximum number of retries',
      );
    }

    return parsedResponse;
  }
}
