import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import BaseDialog from './BaseDialog.vue';

const closeButton = () => document.body.querySelector<HTMLElement>('[data-testid="dialog-close"]');

async function openDialog(closeLabel?: string) {
  const wrapper = mount(BaseDialog, {
    props: { open: true, title: 'Mapa', ...(closeLabel ? { closeLabel } : {}) },
    attachTo: document.body,
  });
  await flushPromises();
  return wrapper;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('BaseDialog', () => {
  it('offers a labelled close button when asked to', async () => {
    await openDialog('Zamknij mapę');

    expect(closeButton()?.getAttribute('aria-label')).toBe('Zamknij mapę');
  });

  it('asks to close when the close button is pressed', async () => {
    const wrapper = await openDialog('Zamknij mapę');

    closeButton()?.click();

    expect(wrapper.emitted('update:open')).toEqual([[false]]);
  });

  it('puts a close button in the screen corner when asked to', async () => {
    const wrapper = mount(BaseDialog, {
      props: { open: true, title: 'Menu', cornerCloseLabel: 'Zamknij menu' },
      attachTo: document.body,
    });
    await flushPromises();

    document.body.querySelector<HTMLElement>('[data-testid="dialog-corner-close"]')?.click();

    expect(wrapper.emitted('update:open')).toEqual([[false]]);
  });

  it('has no close button by default', async () => {
    await openDialog();

    expect(closeButton()).toBeNull();
  });
});
