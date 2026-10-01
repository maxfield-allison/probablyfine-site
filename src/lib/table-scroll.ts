class ScrollTable extends HTMLElement {
  private observer?: ResizeObserver;

  connectedCallback() {
    const viewport = this.querySelector<HTMLElement>('.table-viewport');
    const table = viewport?.querySelector('table');
    const tools = this.querySelector<HTMLElement>('.table-scroll-tools');
    const controls = this.querySelector<HTMLElement>('.table-scroll-buttons');
    if (!viewport || !table || !tools || !controls) return;
    const buttons = controls.querySelectorAll<HTMLButtonElement>('button');
    const update = () => {
      const maximum = viewport.scrollWidth - viewport.clientWidth;
      const overflowing = maximum > 1;
      tools.hidden = !overflowing;
      controls.hidden = !overflowing;
      viewport.tabIndex = overflowing ? 0 : -1;
      buttons.forEach(button => {
        button.disabled = Number(button.dataset.scrollDirection) < 0
          ? viewport.scrollLeft <= 1
          : viewport.scrollLeft >= maximum - 1;
      });
    };
    buttons.forEach(button => {
      button.onclick = () => {
        viewport.scrollBy({
          left: Number(button.dataset.scrollDirection) * viewport.clientWidth * .75,
          behavior: 'instant',
        });
        update();
      };
    });
    viewport.onscroll = update;
    this.observer = new ResizeObserver(update);
    this.observer.observe(viewport);
    this.observer.observe(table);
    update();
  }

  disconnectedCallback() {
    this.observer?.disconnect();
  }
}

if (!customElements.get('scroll-table')) customElements.define('scroll-table', ScrollTable);
