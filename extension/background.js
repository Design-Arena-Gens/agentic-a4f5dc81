const CHANNEL_SEARCH_URL =
  "https://www.youtube.com/results?search_query=IShowSpeed&sp=EgIQAg%3D%3D";
const CHANNEL_NAME_TARGET = "ishowspeed";
const CHANNEL_VIDEOS_SUFFIX = "/videos?view=0&sort=dd&flow=grid";
const VIDEO_QUERY_ATTEMPTS = 20;
const VIDEO_QUERY_DELAY_MS = 500;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.action === "goToLatestVideo") {
    handleGoToLatestVideo()
      .then((result) => sendResponse(result))
      .catch((error) =>
        sendResponse({
          success: false,
          message:
            error?.message ??
            "Unexpected error occurred while locating the latest video."
        })
      );
    return true;
  }
  return undefined;
});

async function handleGoToLatestVideo() {
  const tab = await getActiveTab();
  if (!tab?.id) {
    return {
      success: false,
      message: "Unable to locate the active tab to perform navigation."
    };
  }

  await chrome.tabs.update(tab.id, { url: CHANNEL_SEARCH_URL });
  await waitForTabComplete(tab.id, getUrlPrefix(CHANNEL_SEARCH_URL));

  const channelUrl = await locateChannelUrl(tab.id);
  if (!channelUrl) {
    return {
      success: false,
      message: "Could not find the IShowSpeed channel on YouTube."
    };
  }

  const videosUrl = normalizeChannelVideosUrl(channelUrl);
  await chrome.tabs.update(tab.id, { url: videosUrl });
  await waitForTabComplete(tab.id, getUrlPrefix(videosUrl));

  const videoUrl = await locateLatestVideoUrl(tab.id);
  if (!videoUrl) {
    return {
      success: false,
      message: "Could not locate the latest video on the channel page."
    };
  }

  await chrome.tabs.update(tab.id, { url: videoUrl });

  return {
    success: true,
    message: "Opened the most recent IShowSpeed upload."
  };
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });
  return tab;
}

function waitForTabComplete(tabId, expectedUrlPrefix) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(
        new Error("Navigation timed out before the page finished loading.")
      );
    }, 30000);

    const listener = (updatedTabId, changeInfo, updatedTab) => {
      if (updatedTabId !== tabId || changeInfo.status !== "complete") {
        return;
      }
      const currentUrl = updatedTab?.url ?? "";
      if (
        !expectedUrlPrefix ||
        currentUrl.startsWith(expectedUrlPrefix)
      ) {
        clearTimeout(timeoutId);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };

    chrome.tabs.onUpdated.addListener(listener);
  });
}

async function locateChannelUrl(tabId) {
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: findChannelLink,
    args: [CHANNEL_NAME_TARGET]
  });
  return result?.channelUrl ?? null;
}

async function locateLatestVideoUrl(tabId) {
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: findLatestVideoLink,
    args: [VIDEO_QUERY_ATTEMPTS, VIDEO_QUERY_DELAY_MS]
  });
  return result?.videoUrl ?? null;
}

function normalizeChannelVideosUrl(channelUrl) {
  const url = channelUrl.endsWith("/") ? channelUrl.slice(0, -1) : channelUrl;
  return `${url}${CHANNEL_VIDEOS_SUFFIX}`;
}

function findChannelLink(targetName) {
  const normalize = (value) => value?.toLowerCase().trim();
  const target = normalize(targetName);
  if (!target) {
    return { channelUrl: null };
  }
  const anchors = Array.from(document.querySelectorAll("ytd-channel-renderer a#main-link"));
  for (const anchor of anchors) {
    const textContent = normalize(anchor?.querySelector("#channel-title")?.textContent ?? anchor.textContent);
    if (textContent?.includes(target)) {
      const url = anchor.href || anchor.getAttribute("href");
      if (url) {
        const absolute = url.startsWith("http")
          ? url
          : new URL(url, window.location.origin).href;
        return { channelUrl: absolute };
      }
    }
  }
  return { channelUrl: null };
}

async function findLatestVideoLink(maxAttempts, delayMs) {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const anchor = document.querySelector("ytd-rich-grid-media a#video-title");
    if (anchor?.href) {
      const absolute = anchor.href.startsWith("http")
        ? anchor.href
        : new URL(anchor.href, window.location.origin).href;
      return { videoUrl: absolute };
    }
    await sleep(delayMs);
  }
  return { videoUrl: null };
}

function getUrlPrefix(rawUrl) {
  try {
    const url = new URL(rawUrl);
    return `${url.origin}${url.pathname}`;
  } catch (error) {
    return rawUrl;
  }
}
