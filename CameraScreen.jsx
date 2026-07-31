/* Ajustes clean para login, câmera e recorte */

.login-screen {
  width: 100%;
  min-height: min(68vh, 650px);
  display: grid;
  place-items: center;
  padding: 12px 14px;
}

.login-panel {
  width: min(86vw, 292px);
  padding: 16px 15px 15px;
  border: 1px solid rgba(255, 255, 255, .2);
  border-radius: 17px;
  background: rgba(5, 15, 30, .48);
  box-shadow: 0 18px 52px rgba(0, 0, 0, .28);
  backdrop-filter: blur(7px);
  -webkit-backdrop-filter: blur(7px);
}

.login-panel__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.login-panel__brand h2 {
  margin: 0;
  font-size: .98rem;
  color: #fff;
}

.login-panel__brand p {
  margin: 2px 0 0;
  font-size: .68rem;
  color: rgba(255, 255, 255, .68);
}

.login-panel__logo-box {
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 11px;
  padding: 3px;
  background: rgba(255, 255, 255, .92);
  box-shadow: 0 7px 18px rgba(0, 0, 0, .22);
}

.login-panel__logo-box img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.login-form {
  display: grid;
  gap: 10px;
}

.login-form label {
  display: grid;
  gap: 5px;
}

.login-form label > span {
  display: flex;
  align-items: center;
  gap: 5px;
  color: rgba(255, 255, 255, .82);
  font-size: .68rem;
  font-weight: 700;
}

.login-form input {
  width: 100%;
  min-height: 39px;
  border: 1px solid rgba(255, 255, 255, .18);
  border-radius: 10px;
  padding: 0 11px;
  color: #fff;
  font-size: .86rem;
  background: rgba(1, 8, 18, .46);
  outline: none;
}

.login-form input:focus {
  border-color: rgba(251, 192, 45, .78);
  box-shadow: 0 0 0 3px rgba(251, 192, 45, .1);
}

.login-panel__submit {
  min-height: 40px;
  margin-top: 2px;
  border-radius: 10px;
  font-size: .78rem;
}

.clean-editor {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  grid-template-rows: auto 1fr auto;
  color: #fff;
  background: #050505;
  overscroll-behavior: none;
  touch-action: none;
}

.clean-editor__header {
  min-height: 68px;
  padding: max(12px, env(safe-area-inset-top)) 14px 10px;
  display: grid;
  grid-template-columns: 44px 1fr auto;
  align-items: center;
  gap: 10px;
  background: rgba(8, 8, 8, .96);
}

.clean-editor__header > div {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.clean-editor__header strong {
  font-size: .98rem;
}

.clean-editor__header span {
  color: rgba(255, 255, 255, .58);
  font-size: .72rem;
}

.clean-editor__icon,
.clean-editor__done {
  border: 0;
  color: #fff;
  background: transparent;
  cursor: pointer;
}

.clean-editor__icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 50%;
}

.clean-editor__done {
  min-height: 40px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 12px;
  color: #07111d;
  font-weight: 800;
  background: #fbc02d;
}

.clean-editor__stage {
  position: relative;
  min-height: 0;
  overflow: hidden;
  background: #000;
  user-select: none;
  -webkit-user-select: none;
}

.clean-editor__image {
  position: absolute;
  object-fit: fill;
  transform-origin: center center;
  pointer-events: none;
}

.clean-editor__crop {
  position: absolute;
  cursor: move;
  border: 2px solid rgba(255, 255, 255, .96);
  box-shadow:
    0 0 0 9999px rgba(0, 0, 0, .52),
    0 0 0 1px rgba(0, 0, 0, .25) inset;
}

.crop-handle,
.crop-edge {
  position: absolute;
  z-index: 3;
  padding: 0;
  border: 0;
  background: transparent;
  touch-action: none;
}

.crop-handle {
  width: 30px;
  height: 30px;
}

.crop-handle::before {
  content: "";
  position: absolute;
  width: 17px;
  height: 17px;
  border-color: #fff;
  border-style: solid;
}

.crop-handle--tl { left: -15px; top: -15px; cursor: nwse-resize; }
.crop-handle--tr { right: -15px; top: -15px; cursor: nesw-resize; }
.crop-handle--bl { left: -15px; bottom: -15px; cursor: nesw-resize; }
.crop-handle--br { right: -15px; bottom: -15px; cursor: nwse-resize; }

.crop-handle--tl::before { right: 0; bottom: 0; border-width: 3px 0 0 3px; }
.crop-handle--tr::before { left: 0; bottom: 0; border-width: 3px 3px 0 0; }
.crop-handle--bl::before { right: 0; top: 0; border-width: 0 0 3px 3px; }
.crop-handle--br::before { left: 0; top: 0; border-width: 0 3px 3px 0; }

.crop-edge--top,
.crop-edge--bottom {
  left: 32px;
  right: 32px;
  height: 28px;
  cursor: ns-resize;
}

.crop-edge--left,
.crop-edge--right {
  top: 32px;
  bottom: 32px;
  width: 28px;
  cursor: ew-resize;
}

.crop-edge--top { top: -14px; }
.crop-edge--bottom { bottom: -14px; }
.crop-edge--left { left: -14px; }
.crop-edge--right { right: -14px; }

.clean-editor__footer {
  min-height: 74px;
  padding: 10px 14px max(12px, env(safe-area-inset-bottom));
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  background: rgba(8, 8, 8, .98);
}

.clean-editor__footer button {
  min-height: 48px;
  border: 1px solid rgba(255, 255, 255, .15);
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #fff;
  background: rgba(255, 255, 255, .07);
}

.camera-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 1000;
  color: #fff;
  background: #000;
  overflow: hidden;
}

.camera-fullscreen__top {
  position: absolute;
  z-index: 4;
  top: 0;
  left: 0;
  right: 0;
  min-height: 78px;
  padding: max(16px, env(safe-area-inset-top)) 18px 12px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  background: linear-gradient(180deg, rgba(0, 0, 0, .8), transparent);
}

.camera-fullscreen__top div {
  display: grid;
  gap: 2px;
}

.camera-fullscreen__top span {
  font-size: .65rem;
  font-weight: 800;
  letter-spacing: .13em;
  color: rgba(255, 255, 255, .62);
}

.camera-fullscreen__top strong {
  font-size: 1.22rem;
}

.camera-fullscreen__top b {
  padding: 7px 10px;
  border-radius: 999px;
  font-size: .76rem;
  background: rgba(0, 0, 0, .46);
  backdrop-filter: blur(7px);
}

.camera-fullscreen__progress {
  position: absolute;
  z-index: 5;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(255, 255, 255, .16);
}

.camera-fullscreen__progress i {
  display: block;
  height: 100%;
  background: #fbc02d;
}

.camera-fullscreen__view {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: #000;
}

.camera-fullscreen__view video,
.camera-fullscreen__view img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
}

.camera-fullscreen__view .hidden {
  display: none;
}

.camera-fullscreen__actions {
  position: absolute;
  z-index: 4;
  left: 0;
  right: 0;
  bottom: 0;
  min-height: 124px;
  padding: 18px 28px max(22px, env(safe-area-inset-bottom));
  display: grid;
  grid-template-columns: 54px 1fr 54px;
  align-items: center;
  background: linear-gradient(0deg, rgba(0, 0, 0, .88), transparent);
}

.camera-shutter {
  width: 78px;
  height: 78px;
  margin: auto;
  border: 4px solid #fff;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: transparent;
}

.camera-shutter span {
  width: 62px;
  height: 62px;
  border-radius: 50%;
  background: #fff;
}

.camera-switch {
  width: 50px;
  height: 50px;
  border: 0;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #fff;
  background: rgba(0, 0, 0, .5);
}

.camera-action-spacer {
  width: 50px;
}

.camera-fullscreen__confirm {
  position: absolute;
  z-index: 4;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16px 16px max(18px, env(safe-area-inset-bottom));
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 10px;
  background: rgba(0, 0, 0, .86);
}

.camera-fullscreen__notice {
  position: absolute;
  z-index: 6;
  top: 84px;
  left: 16px;
  right: 16px;
  padding: 11px 13px;
  border-radius: 12px;
  color: #d8ffe3;
  background: rgba(20, 110, 58, .88);
}

.camera-permission {
  position: absolute;
  inset: 0;
  padding: 26px;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 14px;
  text-align: center;
  background: radial-gradient(circle at center, #12233a 0, #040a12 68%);
}

.camera-permission p {
  max-width: 360px;
  color: rgba(255, 255, 255, .7);
}

.camera-error {
  max-width: 390px;
  padding: 24px;
  display: grid;
  justify-items: center;
  gap: 14px;
  text-align: center;
}

@media (max-width: 480px) {
  .login-screen {
    min-height: 64vh;
    padding-top: 6px;
    padding-bottom: 6px;
  }

  .login-panel {
    width: min(82vw, 280px);
    padding: 14px 13px 13px;
    background: rgba(5, 15, 30, .44);
  }

  .clean-editor__header span {
    display: none;
  }

  .clean-editor__done {
    padding-inline: 10px;
  }
}

/* Login compacto para preservar a visualização do brasão de fundo */
.login-screen{
  min-height:calc(100dvh - 118px);
  padding:8px 12px;
}

.login-panel{
  width:min(78vw,268px);
  padding:13px 13px 12px;
  border-radius:15px;
  background:rgba(5,15,30,.38);
  border-color:rgba(255,255,255,.18);
  box-shadow:0 14px 38px rgba(0,0,0,.23);
  backdrop-filter:blur(5px);
  -webkit-backdrop-filter:blur(5px);
}

.login-panel__brand{
  gap:8px;
  margin-bottom:11px;
}

.login-panel__logo-box{
  width:36px;
  height:36px;
  flex-basis:36px;
  border-radius:10px;
  padding:3px;
}

.login-panel__brand h2{font-size:.9rem}
.login-panel__brand p{font-size:.62rem}
.login-form{gap:8px}
.login-form label{gap:4px}
.login-form label>span{font-size:.63rem}
.login-form input{
  min-height:36px;
  padding:0 10px;
  border-radius:9px;
  font-size:.8rem;
  background:rgba(1,8,18,.38);
}
.login-panel__submit{
  min-height:37px;
  border-radius:9px;
  font-size:.73rem;
}

@media(max-width:380px){
  .login-panel{width:min(76vw,250px);padding:12px}
  .login-panel__logo-box{width:33px;height:33px;flex-basis:33px}
}
