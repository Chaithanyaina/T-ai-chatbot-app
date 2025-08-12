import { gql } from '@apollo/client';

export const CREATE_CHAT_MUTATION = gql`
  mutation CreateChat($title: String) {
    insert_chats_one(object: { title: $title }) {
      id
    }
  }
`;

export const INSERT_USER_MESSAGE_MUTATION = gql`
  mutation InsertUserMessage($chat_id: uuid!, $content: String!) {
    insert_messages_one(object: { chat_id: $chat_id, content: $content, role: "user" }) {
      id
    }
  }
`;

export const SEND_MESSAGE_ACTION = gql`
  mutation SendMessage($chat_id: uuid!, $message: String!) {
    sendMessage(input: { chat_id: $chat_id, message: $message }) {
      reply
    }
  }
`;