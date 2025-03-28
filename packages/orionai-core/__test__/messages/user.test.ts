import { describe, it, expect } from 'vitest'
import { UserMessage, type IUserMessageFields } from '@/messages'
import { DEV_LOGGER } from '@/lib/logger'

describe('UserMessage', () => {
  it('should create a UserMessage instance with the correct properties', () => {
    const props: IUserMessageFields = {
      content: 'Hello, world!',
      // id: "123",
      // created_at: "2025-02-22T10:00:00Z",
      // token_count: 5,
      // metadata: { key: "value" },
    }

    const message = new UserMessage(props)

    expect(message).toBeInstanceOf(UserMessage)
    expect(message.content).toBe(props.content)
    // expect(message.id).toBe(props.id);
    // expect(message.created_at).toBe(props.created_at);
    // expect(message.token_count).toBe(props.token_count);
    // expect(message.metadata).toEqual(props.metadata);

    DEV_LOGGER.INFO('message', message)
  })

  it('should return the correct properties from the get method', () => {
    const props: IUserMessageFields = {
      content: 'Hello, world!',
    }

    const message = new UserMessage(props)
    const result = message

    expect(result.content).toBe(props.content)
    expect(result.id).toBe(props.id)
  })

  it('should throw an error if content is not provided', () => {
    // @ts-ignore
    expect(() => new UserMessage()).toThrow('[orion-ai] Message content is required.')
    // @ts-ignore
    expect(() => new UserMessage({ id: '123' })).toThrow('[orion-ai] Message content is required.')
  })

  it('should be a message list', () => {
    const props: IUserMessageFields = {
      content: [
        { role: 'user', content: 'Hello, world!' },
        { role: 'assistant', content: 'Hello, user!' },
      ],
    }

    const message = new UserMessage({
      content: {
        type: 'input_image',
        image_url:
          'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png',
      },
    })

    console.log('messages', message)

    expect(message).toBeInstanceOf(UserMessage)
  })
})
