import fs from 'fs';
import path from 'path';
import gql from 'graphql-tag';
import { userQueries } from './user/query';
import { userMutations } from './user/mutation';
import { ticketQueries } from './ticket/query';
import { ticketMutations } from './ticket/mutation';

function loadSDL(fileName: string) {
  const filePath = path.join(__dirname, fileName);
  return gql(fs.readFileSync(filePath, 'utf-8'));
}

export const typeDefs = [
  loadSDL('base.graphql'),
  loadSDL('user/user.graphql'),
  loadSDL('ticket/ticket.graphql'),
];

export const resolvers = {
  Query: {
    ...userQueries,
    ...ticketQueries,
  },
  Mutation: {
    ...userMutations,
    ...ticketMutations,
  },
};

export { createContext } from '../context';
