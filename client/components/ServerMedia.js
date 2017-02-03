import React from 'react';
import { CardMedia, CardTitle } from 'material-ui/Card';
import PeopleIcon from 'material-ui/svg-icons/social/people';

const overlayContentStyle = {
  background: 'rgba(0, 0, 0, 0.75)',
};

const peopleIconStyle = {
  verticalAlign: 'sub',
  marginRight: 5,
};

const ServerOverlay = ({ media, users }) => (
  <CardTitle
    title={media.title}
    subtitle={media.artist}
  >
    <div className="population">
      <PeopleIcon style={peopleIconStyle} />
      {users}
    </div>

    <style jsx>{`
      .population {
        position: absolute;
        bottom: 0;
        right: 8px;
        padding: 16px;
        font-size: 24px;
        color: white;
        opacity: 0.85;
      }
    `}</style>
  </CardTitle>
);

const CurrentMedia = ({
  media,
}) => (media ? (
  <CardMedia
    overlay={<ServerOverlay media={media} users={10} />}
    overlayContentStyle={overlayContentStyle}
  >
    <div
      className="image"
      style={{ backgroundImage: `url(${JSON.stringify(media.thumbnail)})` }}
    />

    <style jsx>{`
      .image {
        width: 100%;
        padding-bottom: 75%;
        background-color: black;
        background-position: center center;
        background-size: contain;
        background-repeat: no-repeat;
      }
    `}</style>
  </CardMedia>
) : (
  <span />
));

export default CurrentMedia;
