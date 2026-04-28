/**
 * Clerk Appearance theme — Playful Sticker Shop direction.
 *
 * Drop-in for <ClerkProvider>'s `appearance` prop. Translates the
 * design tokens (ink #0F0E0C / cream #FFF8EC / WA-green #25D366 +
 * hard-offset shadows) into Clerk's CSS-in-JS Appearance API so the
 * sign-in / sign-up / UserButton / OTP UIs all match the rest of the
 * app instead of looking like generic Clerk components.
 *
 * Notes:
 * - The `&:hover` / `&:active` syntax is Clerk's mini CSS-in-JS — it
 *   compiles down to real CSS at render time. If a future Clerk update
 *   breaks it, fall back to a global <style> block targeting cl-* classes.
 * - Some sub-components aren't fully covered by the Appearance API
 *   (notably the in-modal loading spinner). Use DevTools to find any
 *   stray cl-* class and add it as a key in `elements` to override.
 */

// Clerk's `Appearance` type lives in @clerk/types but the @clerk/nextjs
// runtime just accepts any object that matches its shape — we let Clerk
// type-check via the prop assignment in layout.tsx rather than pulling
// in another package just for one type.
type Appearance = Record<string, unknown>;

const INK = "#0F0E0C";
const CREAM = "#FFF8EC";
const PAPER = "#FBF3DD";
const WA = "#25D366";
const WA_DARK = "#0E7A3E";
const RED = "#E84C2B";
const FONT_HEAD = "'Karantina', 'Heebo', sans-serif";
const FONT_BODY = "'Assistant', system-ui, sans-serif";
const FONT_MONO = "'JetBrains Mono', monospace";

export const clerkAppearance: Appearance = {
  layout: {
    socialButtonsPlacement: "top",
    socialButtonsVariant: "blockButton",
    logoPlacement: "inside",
    logoImageUrl: "/madbeka-icon-round.svg",
    showOptionalFields: true,
    privacyPageUrl: "/privacy",
    termsPageUrl: "/terms",
    helpPageUrl: "/templates",
  },

  variables: {
    colorPrimary: WA,
    colorDanger: RED,
    colorSuccess: WA,
    colorWarning: "#F4C430",
    colorNeutral: INK,
    colorBackground: CREAM,
    colorInputBackground: "#FFFFFF",
    colorInputText: INK,
    colorText: INK,
    colorTextSecondary: "rgba(15,14,12,0.65)",
    colorTextOnPrimaryBackground: "#FFFFFF",
    colorShimmer: "rgba(15,14,12,0.06)",
    fontFamily: FONT_BODY,
    fontFamilyButtons: FONT_HEAD,
    fontSize: "15px",
    borderRadius: "14px",
    spacingUnit: "4px",
  },

  elements: {
    // Root surface
    rootBox: {
      direction: "rtl",
    },
    card: {
      backgroundColor: CREAM,
      border: `3px solid ${INK}`,
      borderRadius: "26px",
      boxShadow: `0 24px 0 ${INK}, 0 0 0 8px rgba(15,14,12,0.08)`,
      padding: "32px 30px",
    },
    cardBox: {
      boxShadow: "none",
      border: "none",
    },

    // Header
    header: { textAlign: "center" },
    headerTitle: {
      fontFamily: FONT_HEAD,
      fontWeight: 700,
      fontSize: "38px",
      lineHeight: 1,
      letterSpacing: "-0.02em",
      color: INK,
    },
    headerSubtitle: {
      fontFamily: FONT_BODY,
      fontSize: "14px",
      color: "rgba(15,14,12,0.65)",
      marginTop: "5px",
    },
    logoBox: { justifyContent: "center", marginBottom: "12px" },
    logoImage: {
      width: "64px",
      height: "64px",
      borderRadius: "16px",
      transform: "rotate(-4deg)",
      boxShadow: `4px 5px 0 ${WA}`,
      border: `2px solid ${INK}`,
      background: INK,
    },

    // Social buttons
    socialButtonsBlockButton: {
      backgroundColor: "#FFFFFF",
      color: INK,
      border: `2px solid ${INK}`,
      borderRadius: "12px",
      padding: "12px 16px",
      fontFamily: FONT_BODY,
      fontWeight: 700,
      fontSize: "14px",
      boxShadow: `3px 4px 0 ${INK}`,
      transition: "transform 0.08s ease, box-shadow 0.08s ease",
      "&:hover": {
        backgroundColor: PAPER,
        transform: "translate(-1px,-1px)",
        boxShadow: `4px 5px 0 ${INK}`,
      },
      "&:active": {
        transform: "translate(2px,2px)",
        boxShadow: `1px 2px 0 ${INK}`,
      },
    },
    socialButtonsBlockButtonText: {
      fontFamily: FONT_BODY,
      fontWeight: 700,
    },
    socialButtonsProviderIcon: { width: "18px", height: "18px" },

    // Divider
    dividerRow: { margin: "16px 0" },
    dividerLine: {
      backgroundImage: `repeating-linear-gradient(to right, ${INK} 0 4px, transparent 4px 8px)`,
      height: "1.5px",
      backgroundColor: "transparent",
      opacity: 0.4,
    },
    dividerText: {
      fontFamily: FONT_MONO,
      fontSize: "11px",
      color: "rgba(15,14,12,0.5)",
      letterSpacing: "0.1em",
    },

    // Form fields
    formFieldLabel: {
      fontFamily: FONT_BODY,
      fontWeight: 700,
      fontSize: "13px",
      color: INK,
      marginBottom: "6px",
    },
    formFieldInput: {
      backgroundColor: "#FFFFFF",
      border: `2px solid ${INK}`,
      borderRadius: "12px",
      padding: "12px 14px",
      fontFamily: FONT_BODY,
      fontSize: "15px",
      color: INK,
      boxShadow: "inset 0 2px 0 rgba(15,14,12,0.05)",
      "&:focus": {
        borderColor: WA,
        boxShadow:
          "inset 0 2px 0 rgba(15,14,12,0.05), 0 0 0 3px rgba(37,211,102,0.25)",
        outline: "none",
      },
    },
    formFieldInputShowPasswordButton: {
      color: "rgba(15,14,12,0.6)",
    },
    formFieldErrorText: {
      fontFamily: FONT_BODY,
      color: RED,
      fontSize: "12px",
      fontWeight: 700,
    },

    // Primary submit button
    formButtonPrimary: {
      backgroundColor: WA,
      color: "#FFFFFF",
      border: `2.5px solid ${INK}`,
      borderRadius: "14px",
      padding: "14px 18px",
      fontFamily: FONT_HEAD,
      fontWeight: 700,
      fontSize: "22px",
      letterSpacing: "0.01em",
      boxShadow: `5px 6px 0 ${INK}`,
      textTransform: "none",
      transition: "transform 0.08s ease, box-shadow 0.08s ease",
      "&:hover": {
        backgroundColor: WA,
        transform: "translate(-1px,-1px)",
        boxShadow: `6px 7px 0 ${INK}`,
      },
      "&:active": {
        transform: "translate(3px,3px)",
        boxShadow: `2px 3px 0 ${INK}`,
      },
      "&:disabled": {
        backgroundColor: "rgba(37,211,102,0.4)",
        boxShadow: `3px 4px 0 rgba(15,14,12,0.3)`,
        cursor: "not-allowed",
      },
    },

    // Footer / mode-switch
    footer: {
      backgroundColor: "transparent",
      paddingTop: "14px",
      borderTop: `1.5px dashed ${INK}`,
      marginTop: "18px",
    },
    footerActionText: {
      fontFamily: FONT_BODY,
      fontSize: "13px",
      color: "rgba(15,14,12,0.7)",
    },
    footerActionLink: {
      color: WA_DARK,
      fontWeight: 700,
      textDecoration: "underline dashed",
      "&:hover": { color: WA },
    },
    footerPagesLink: {
      fontFamily: FONT_MONO,
      fontSize: "10px",
      color: "rgba(15,14,12,0.5)",
      letterSpacing: "0.05em",
    },

    // Identity preview / OTP
    identityPreview: {
      backgroundColor: PAPER,
      border: `2px dashed ${INK}`,
      borderRadius: "12px",
      padding: "10px 14px",
    },
    identityPreviewText: {
      fontFamily: FONT_BODY,
      color: INK,
      fontWeight: 700,
    },
    identityPreviewEditButton: { color: WA_DARK },
    otpCodeFieldInput: {
      backgroundColor: "#FFFFFF",
      border: `2px solid ${INK}`,
      borderRadius: "10px",
      fontFamily: FONT_MONO,
      fontSize: "20px",
      fontWeight: 700,
      color: INK,
      boxShadow: "inset 0 2px 0 rgba(15,14,12,0.05)",
    },

    // Alerts
    alert: {
      borderRadius: "12px",
      border: `2px solid ${INK}`,
      fontFamily: FONT_BODY,
      fontWeight: 600,
    },
    alertText: {
      fontFamily: FONT_BODY,
    },

    // UserButton + popover
    avatarBox: {
      borderRadius: "12px",
      border: `2px solid ${INK}`,
      boxShadow: `3px 4px 0 ${INK}`,
    },
    userButtonAvatarBox: {
      width: "38px",
      height: "38px",
    },
    userButtonPopoverCard: {
      backgroundColor: CREAM,
      border: `2.5px solid ${INK}`,
      borderRadius: "18px",
      boxShadow: `8px 10px 0 ${INK}`,
    },
    userPreviewMainIdentifier: {
      fontFamily: FONT_HEAD,
      fontWeight: 700,
      fontSize: "20px",
      color: INK,
    },
    userPreviewSecondaryIdentifier: {
      fontFamily: FONT_BODY,
      fontSize: "12px",
      color: "rgba(15,14,12,0.6)",
    },

    // UserProfile sidebar
    navbar: {
      backgroundColor: PAPER,
      borderRight: `2px solid ${INK}`,
    },
    // Clerk's mini CSS-in-JS supports pseudo-class selectors like
    // `&:hover` / `&:active` but does NOT support attribute selectors.
    // An earlier version had `"&[data-selected]"` here which was silently
    // ignored at best and crashed Clerk's appearance parser at worst —
    // suspected as the cause of the production 500s during /handshake.
    // The selected-tab visual state now comes from Clerk's defaults
    // (which already darken the active item).
    navbarButton: {
      fontFamily: FONT_BODY,
      fontWeight: 700,
      color: INK,
      borderRadius: "10px",
    },

    // Misc small text
    formFieldHintText: {
      fontFamily: FONT_BODY,
      fontSize: "11px",
      color: "rgba(15,14,12,0.5)",
    },
    formResendCodeLink: {
      color: WA_DARK,
      fontWeight: 700,
    },
    badge: {
      backgroundColor: WA,
      color: "#FFFFFF",
      border: `1.5px solid ${INK}`,
      borderRadius: "100px",
      fontFamily: FONT_MONO,
      fontSize: "10px",
      fontWeight: 700,
      letterSpacing: "0.06em",
      padding: "3px 9px",
    },
  },
};
