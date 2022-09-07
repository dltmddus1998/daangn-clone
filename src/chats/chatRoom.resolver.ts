import { ParseBoolPipe, ParseFilePipe, ParseIntPipe, UsePipes, ValidationPipe } from '@nestjs/common';
import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { ChatRoom } from './chatRoom.entity';

@Resolver(() => ChatRoom)
export class ChatRoomResolver {}
