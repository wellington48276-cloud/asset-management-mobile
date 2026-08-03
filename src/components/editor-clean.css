.clean-editor {
  position: fixed;
  inset: 0;
  z-index: 999;
  display: grid;
  grid-template-rows: auto 1fr auto;
  color: #fff;
  background: #03070b;
  overscroll-behavior: none;
  touch-action: none;
}
.clean-editor__header {
  min-height: 68px;
  padding: calc(10px + env(safe-area-inset-top)) 12px 10px;
  display: grid;
  grid-template-columns: 44px minmax(0,1fr) auto;
  align-items: center;
  gap: 9px;
  background: rgba(3,7,11,.97);
  border-bottom: 1px solid rgba(255,255,255,.1);
}
.clean-editor__header > div { min-width: 0; display: grid; gap: 2px; }
.clean-editor__header strong { font-size: .98rem; }
.clean-editor__header span { color: rgba(255,255,255,.58); font-size: .69rem; }
.clean-editor__icon, .clean-editor__done { border: 0; cursor: pointer; }
.clean-editor__icon { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 50%; color: #fff; background: rgba(255,255,255,.08); }
.clean-editor__done { min-height: 42px; padding: 0 13px; display: inline-flex; align-items: center; gap: 6px; border-radius: 12px; color: #06101d; background: #f6c945; font-weight: 900; }
.clean-editor__stage { position: relative; min-height: 0; overflow: hidden; background: #000; user-select: none; -webkit-user-select: none; }
.clean-editor__image { position: absolute; object-fit: fill; transform-origin: center; pointer-events: none; }
.clean-editor__crop { position: absolute; cursor: move; border: 2px solid rgba(255,255,255,.96); box-shadow: 0 0 0 9999px rgba(0,0,0,.58); }
.crop-handle, .crop-edge { position: absolute; z-index: 3; padding: 0; border: 0; background: transparent; touch-action: none; }
.crop-handle { width: 34px; height: 34px; }
.crop-handle::before { content: ""; position: absolute; width: 18px; height: 18px; border-color: #f6c945; border-style: solid; }
.crop-handle--tl { left: -17px; top: -17px; cursor: nwse-resize; }
.crop-handle--tr { right: -17px; top: -17px; cursor: nesw-resize; }
.crop-handle--bl { left: -17px; bottom: -17px; cursor: nesw-resize; }
.crop-handle--br { right: -17px; bottom: -17px; cursor: nwse-resize; }
.crop-handle--tl::before { right: 0; bottom: 0; border-width: 3px 0 0 3px; }
.crop-handle--tr::before { left: 0; bottom: 0; border-width: 3px 3px 0 0; }
.crop-handle--bl::before { right: 0; top: 0; border-width: 0 0 3px 3px; }
.crop-handle--br::before { left: 0; top: 0; border-width: 0 3px 3px 0; }
.crop-edge--top, .crop-edge--bottom { left: 34px; right: 34px; height: 30px; cursor: ns-resize; }
.crop-edge--left, .crop-edge--right { top: 34px; bottom: 34px; width: 30px; cursor: ew-resize; }
.crop-edge--top { top: -15px; }
.crop-edge--bottom { bottom: -15px; }
.crop-edge--left { left: -15px; }
.crop-edge--right { right: -15px; }
.clean-editor__footer { min-height: 76px; padding: 10px 12px calc(10px + env(safe-area-inset-bottom)); display: grid; grid-template-columns: 1fr 1fr; gap: 9px; background: rgba(3,7,11,.98); border-top: 1px solid rgba(255,255,255,.1); }
.clean-editor__footer button { min-height: 50px; display: flex; align-items: center; justify-content: center; gap: 8px; border: 1px solid rgba(255,255,255,.14); border-radius: 13px; color: #fff; background: rgba(255,255,255,.07); font-weight: 800; }
@media (max-width: 380px) {
  .clean-editor__header { grid-template-columns: 42px minmax(0,1fr) auto; }
  .clean-editor__done { padding: 0 10px; font-size: .75rem; }
  .clean-editor__header span { display: none; }
}
