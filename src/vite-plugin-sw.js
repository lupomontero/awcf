import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const listFiles = async (dir) => {
  const subdirs = await readdir(dir);
  const files = await Promise.all(
    subdirs.map(async (subdir) => {
      const res = `${dir}/${subdir}`;
      return (await stat(res)).isDirectory() ? listFiles(res) : res;
    }),
  );
  return files.flat();
};

export const populateServiceWorkerPreCache = () => ({
  name: 'vite-plugin-populate-sw-precache',
  async writeBundle(options) {
    const files = (await listFiles(options.dir)).reduce(
      (memo, file) => {
        const relativePath = file.replace(`${options.dir}/`, '');
        if (relativePath === 'index.html') {
          return memo.concat('/'); // Alias index.html to /
        }
        return memo.concat(relativePath);
      },
      [],
    );

    const swFilePath = path.join(options.dir, 'sw.js');
    const swFileContent = await readFile(swFilePath, 'utf-8');

    await writeFile(
      swFilePath,
      swFileContent
        .replace(
          '// This is populated with the build step.',
          files.map((f) => `'${f}'`).join(',\n        '),
        )
        .replace(
          /const OFFLINE_VERSION = (\d+);/,
          `const OFFLINE_VERSION = ${Date.now()};`,
        ),
    );
  },
});