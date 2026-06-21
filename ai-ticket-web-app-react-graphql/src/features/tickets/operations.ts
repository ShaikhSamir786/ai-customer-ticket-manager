import { gql } from '@apollo/client';

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        name
        email
        role
        teamId
      }
    }
  }
`;

export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      id
      name
      email
      role
      teamId
    }
  }
`;

export const GET_TICKETS = gql`
  query GetTickets($status: String, $priority: String, $assignedTeam: String, $page: Int, $limit: Int) {
    tickets(status: $status, priority: $priority, assignedTeam: $assignedTeam, page: $page, limit: $limit) {
      nodes {
        id
        subject
        message
        status
        priority
        category
        assignedTeam
        assignedAgentId
        customerId
        source
        confidence
        needsHumanReview
        suggestedReply
        createdAt
        updatedAt
      }
      totalCount
      hasNextPage
      hasPreviousPage
      page
      limit
    }
  }
`;

export const GET_TICKET_DETAIL = gql`
  query GetTicket($id: ID!) {
    ticket(id: $id) {
      id
      subject
      message
      status
      priority
      category
      assignedTeam
      assignedAgentId
      customerId
      source
      confidence
      needsHumanReview
      suggestedReply
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_TICKET = gql`
  mutation UpdateTicket($id: ID!, $input: UpdateTicketInput!) {
    updateTicket(id: $id, input: $input) {
      id
      subject
      message
      status
      priority
      category
      assignedTeam
      assignedAgentId
      confidence
      needsHumanReview
      suggestedReply
      createdAt
      updatedAt
    }
  }
`;
