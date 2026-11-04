/**
 * Compatibility exports for products still using the shared biometric helper.
 * New product code should wrap these capabilities behind its platform/application
 * boundary so authentication policy remains product-owned during migration.
 */
export {
	isPlatformAuthenticatorAvailable,
	detectPlatform,
	biometricLabel,
	biometricLabelFor,
	type Platform
} from "./biometric";
export { BROWSER_THEME_COLOR, emailPresentation } from "./presentation";
export { renderFatalError } from "./fatal-error";
