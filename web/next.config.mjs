import createMDX from '@next/mdx';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [
      remarkGfm,                                        // 표·체크리스트
      remarkFrontmatter,
      [remarkMdxFrontmatter, { name: 'frontmatter' }]   // export const frontmatter
    ]
  }
});

/** @type {import('next').NextConfig} */
export default withMDX({
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  pageExtensions: ['ts', 'tsx', 'mdx']
});
