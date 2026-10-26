// Section 5 and the forest hold the page still while Puli is carried off, falls and lands.
export function holdScroll(on) {
  const v = on ? 'hidden' : '';
  document.documentElement.style.overflow = v;
  document.body.style.overflow = v;
}
