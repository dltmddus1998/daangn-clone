import { Logger } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { onlineMap } from './onlineMap';
import * as config from 'config';

const serverConfig: any = config.get('server');

@WebSocketGateway(serverConfig.port, {
  transports: ['websocket'],
  namespace: 'namespace',
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor() {}

  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('EventsGateway');

  @SubscribeMessage('test')
  handleEvent(
    @MessageBody()
    data: string,
  ): string {
    return data;
  }

  afterInit(server: Server) {
    this.logger.log('🚀 WebSocket server init!!');
  }

  handleConnection(
    @ConnectedSocket()
    socket: Socket,
  ) {
    this.logger.log('connected', socket.nsp.name);
    if (!onlineMap[socket.nsp.name]) {
      onlineMap[socket.nsp.name] = {};
    }

    socket.emit('hello', socket.nsp.name);
  }

  handleDisconnect(
    @ConnectedSocket()
    socket: Socket,
  ) {
    this.logger.log('disconnected', socket.nsp.name);
    const newNameSpace = socket.nsp;
    delete onlineMap[socket.nsp.name][socket.id];
    newNameSpace.emit('onlineList', Object.values(onlineMap[socket.nsp.name]));
  }
}

// namespace (서버) -> room (방)
// namespace는
