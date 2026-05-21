; DP-09b: NSIS installer hooks for Vectair Flite
;
; NSIS_HOOK_POSTINSTALL runs after the installer has:
;   - copied all files to $INSTDIR
;   - written registry keys
;   - created desktop and Start Menu shortcuts
;
; Tauri's default CreateShortcut call omits the icon argument, which
; leaves IconLocation as ",0" (empty path, index 0). On some Windows
; configurations this causes the shortcut to display a blank icon even
; though the exe's embedded icon is valid.
;
; This hook deletes each shortcut immediately after it is created and
; recreates it with an explicit icon argument pointing to the installed
; exe. The result is IconLocation = "C:\...\vectair-flite.exe,0" which
; Windows Explorer resolves reliably.

!macro NSIS_HOOK_POSTINSTALL
  ; --- Desktop shortcut ---
  Delete "$DESKTOP\${PRODUCTNAME}.lnk"
  CreateShortcut "$DESKTOP\${PRODUCTNAME}.lnk" "$INSTDIR\${MAINBINARYNAME}.exe" "" "$INSTDIR\${MAINBINARYNAME}.exe" 0

  ; --- Start Menu shortcut ---
  ; $AppStartMenuFolder is populated by the MUI_STARTMENU page earlier in
  ; the installer; it defaults to the product name when no startMenuFolder
  ; is configured in tauri.conf.json.
  ; Guard against an empty variable (silent/passive installs may skip the
  ; MUI page and leave the variable unset).
  StrCmp $AppStartMenuFolder "" dp09b_sm_done
    Delete "$SMPROGRAMS\$AppStartMenuFolder\${PRODUCTNAME}.lnk"
    CreateShortcut "$SMPROGRAMS\$AppStartMenuFolder\${PRODUCTNAME}.lnk" "$INSTDIR\${MAINBINARYNAME}.exe" "" "$INSTDIR\${MAINBINARYNAME}.exe" 0
  dp09b_sm_done:
!macroend
