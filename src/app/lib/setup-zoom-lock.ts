const preventGestureZoom = (event: Event): void => {
  event.preventDefault();
};

const preventCtrlWheelZoom = (event: WheelEvent): void => {
  if (event.ctrlKey) {
    event.preventDefault();
  }
};

export const setupZoomLock = (): (() => void) => {
  document.addEventListener('gesturestart', preventGestureZoom, { passive: false });
  document.addEventListener('gesturechange', preventGestureZoom, { passive: false });
  document.addEventListener('gestureend', preventGestureZoom, { passive: false });
  window.addEventListener('wheel', preventCtrlWheelZoom, { passive: false });

  return () => {
    document.removeEventListener('gesturestart', preventGestureZoom);
    document.removeEventListener('gesturechange', preventGestureZoom);
    document.removeEventListener('gestureend', preventGestureZoom);
    window.removeEventListener('wheel', preventCtrlWheelZoom);
  };
};
