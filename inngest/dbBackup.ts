import { inngest } from "./client";
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export default inngest.createFunction(
  {
    id: "database-backup",
    name: 'Database Backup',
    concurrency: 1,
  },
  { cron: "0 2 * * *" },  // Runs daily at 2 AM
  async ({ event, step }) => {
    const backupResult = await step.run('create-backup', async () => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `backup-${timestamp}.sql.gz`;
      const backupPath = path.join('./data_backups', backupFileName);

      await fs.promises.mkdir('./data_backups', { recursive: true });

      const { stdout, stderr } = await execAsync(
        `docker exec postgres-container pg_dumpall -U postgres | gzip > ${backupPath}`,
        { shell: true }
      );

      const stats = await fs.promises.stat(backupPath);
      if (stats.size === 0) {
        throw new Error('Backup file is empty');
      }

      return {
        success: true,
        message: `Backup created: ${backupFileName}`,
        size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
        path: backupPath
      };
    });

    await step.run('rotate-backups', async () => {
      const backupDir = './data_backups';
      const files = await fs.promises.readdir(backupDir);

      const backupFiles = files
        .filter(f => f.endsWith('.sql.gz'))
        .map(f => ({
          name: f,
          path: path.join(backupDir, f),
          mtime: fs.statSync(path.join(backupDir, f)).mtimeMs
        }))
        .sort((a, b) => b.mtime - a.mtime);

      const toDelete = backupFiles.slice(15);
      for (const file of toDelete) {
        await fs.promises.unlink(file.path);
        console.log(`Deleted old backup: ${file.name}`);
      }

      return {
        deleted: toDelete.length,
        kept: backupFiles.length - toDelete.length
      };
    });

    return backupResult;
  }
);