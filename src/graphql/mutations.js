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
export const UPDATE_CHAT_TITLE_MUTATION = gql`
  mutation UpdateChatTitle($id: uuid!, $title: String!) {
    update_chats_by_pk(pk_columns: {id: $id}, _set: {title: $title}) {
      id
      title
    }
  }
`;

export const DELETE_CHAT_MUTATION = gql`
  mutation DeleteChat($id: uuid!) {
    delete_chats_by_pk(id: $id) {
      id
    }
  }
`;
export const UPDATE_MESSAGE_MUTATION = gql`
  mutation UpdateMessage($id: uuid!, $content: String!) {
    update_messages_by_pk(pk_columns: {id: $id}, _set: {content: $content}) {
      id
      content
    }
  }
`;

export const DELETE_MESSAGE_MUTATION = gql`
  mutation DeleteMessage($id: uuid!) {
    delete_messages_by_pk(id: $id) {
      id
    }
  }
`;