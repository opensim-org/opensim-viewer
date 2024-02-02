import { observer } from 'mobx-react';
import TwitterIcon from '@mui/icons-material/Twitter';
import FacebookIcon from '@mui/icons-material/Facebook';
import LinkedinIcon from '@mui/icons-material/LinkedIn';
import LinkIcon from '@mui/icons-material/Link';
import { useTranslation } from 'react-i18next'
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Grid from '@mui/material/Grid';
import ShareModal from './ShareModal';
import { Stack } from '@mui/material'

function FileView() {
  const { t } = useTranslation();

  const shareOnTwitter = () => {
    // Get the current page URL
    const currentURL = window.location.href;

    // Encode the URL and text to be shared
    const encodedURL = encodeURIComponent(currentURL);
    const text = encodeURIComponent(t('shareView.twitterShareText')!);

    // Create the Twitter share URL
    const twitterShareURL = `https://twitter.com/intent/tweet?url=${encodedURL}&text=${text}`;

    // Open a new window to share on Twitter
    window.open(twitterShareURL, '_blank');
  };

  const shareOnFacebook = () => {
    // Get the current page URL
    const currentURL = window.location.href;

    // Create a Facebook share URL with the Open Graph meta tags
    const facebookShareURL = `https://www.facebook.com/sharer/sharer.php?u=${currentURL}`;

    // Open a new window to share on Facebook
    window.open(facebookShareURL, '_blank');
  };

  const shareOnLinkedIn = () => {
    // Get the current page URL
    const currentURL = window.location.href;

    // Create a LinkedIn share URL
    const linkedInShareURL = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(currentURL)}`;

    // Open a new window to share on LinkedIn
    window.open(linkedInShareURL, '_blank');
  };

  return (
  <>
    <Tooltip title={t('shareView.shareOnTwitter')}>
      <Button color="inherit" onClick={shareOnTwitter}>
          <Grid container alignItems="center">
            <Grid item>
                <span style={{marginRight: '1em'}}>
                    <TwitterIcon/>
                </span>
            </Grid>
            <Grid item>
              {t('shareView.shareOnTwitter')}
            </Grid>
          </Grid>
      </Button>
    </Tooltip>

    <Tooltip title={t('shareView.shareOnFacebook')}>
      <Button color="inherit" onClick={shareOnFacebook}>
          <Grid container alignItems="center">
            <Grid item>
                <span style={{marginRight: '1em'}}>
                    <FacebookIcon/>
                </span>
            </Grid>
            <Grid item>
              {t('shareView.shareOnFacebook')}
            </Grid>
          </Grid>
      </Button>
    </Tooltip>

    <Tooltip title={t('shareView.shareOnLinkedIn')}>
      <Button color="inherit" onClick={shareOnLinkedIn}>
          <Grid container alignItems="center">
            <Grid item>
                <span style={{marginRight: '1em'}}>
                    <LinkedinIcon/>
                </span>
            </Grid>
            <Grid item>
              {t('shareView.shareOnLinkedIn')}
            </Grid>
          </Grid>
      </Button>
    </Tooltip>


    <Stack direction="row" color="primary" justifyContent="center">
      <span style={{marginRight: '1em'}}><LinkIcon/>
      </span>
      <ShareModal message={window.location.href}/>
    </Stack>
  </>
  );
}

export default observer(FileView);