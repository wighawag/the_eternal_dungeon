import { getParamsFromURLHash, getParamsFromURL } from './utils/web';
if (process.browser) {
    window.params = getParamsFromURL(location.href);
	window.hashParams = getParamsFromURLHash(location.hash);
}
