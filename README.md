# IM

1、IM对接步骤
```
1、将原系统帐户通过/im/sync接口导入到本系统，接口的详细参数请查看/src/server/im/index.js
2、上述接口中，key的参数可以不传，默认为'yunXiang'，
3、上述接口中，ticket参数为原系统中ticket加密字符串

```

2、消息接口对接
```

1、均使用websocket方式对接
2、websocket头部中须添加'im-key'相关值，如为快传帐户系统可以不用设置，默认值为:'yunXiang'
3、其它接口详细参数，请查看/src/server/socket/chat/service.js文件

```


2、文件上传服务端
```

1、均使用websocket方式对接
2、websocket头部中须添加'im-key'相关值，如为快传帐户系统可以不用设置，默认值为:'yunXiang'
3、详细代码，请查看/src/server/socket/file/index.js文件
4、这里有node端的client上传文件，请查看/src/server/socket/file/client.js文件,服务端添加了rsmq(redis的消息队列)用于其他项目业务逻辑的解耦.
5、浏览器端的上传文件，请查看 transfer_vue 项目

```