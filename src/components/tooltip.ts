// Single shared react-tooltip anchor id. Spread tip(content) onto any element to
// give it a themed hover tooltip rendered by the global <AppTooltip />.
export const TIP_ID = 'app-tip';

export function tip(content: string) {
  return { 'data-tooltip-id': TIP_ID, 'data-tooltip-content': content } as const;
}
