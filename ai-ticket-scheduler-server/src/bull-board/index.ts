import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { triageQueue } from '../queue/triage.queue';
import config from '../config/config';

export function setupBullBoard() {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [new BullMQAdapter(triageQueue)],
    serverAdapter: serverAdapter,
  });

  const router = serverAdapter.getRouter();

  if (config.bullBoardPassword) {
    const authHeader = Buffer.from(`admin:${config.bullBoardPassword}`).toString('base64');
    router.use((req: any, res: any, next: any) => {
      const provided = req.headers?.authorization as string | undefined;
      if (provided === `Basic ${authHeader}`) return next();
      res.set('WWW-Authenticate', 'Basic realm="Bull Board", charset="UTF-8"');
      res.status(401).end('Unauthorized');
    });
  }

  return router;
}
