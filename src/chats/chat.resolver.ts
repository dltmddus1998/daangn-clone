import { ParseBoolPipe, ParseFilePipe, ParseIntPipe, UsePipes, ValidationPipe } from '@nestjs/common';
import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { Chat } from './chat.entity';

@Resolver(() => Chat)
export class ChatResolver {}
