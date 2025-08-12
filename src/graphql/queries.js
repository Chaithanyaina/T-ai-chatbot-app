import { gql } from '@apollo/client';

export const GET_CHATS_QUERY = gql`
  query GetChats {
    chats(order_by: { created_at: desc }) {
      id
      title
      created_at
    }
  }
`;