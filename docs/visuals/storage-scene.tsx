import { InView } from './in-view';

import './motion.css';
import './stack-scene.css';
import './storage-scene.css';

const STORAGE_CONNECTIONS = [
  'M240 130V158Q240 174 224 174H76Q60 174 60 190V220',
  'M240 130V158Q240 174 224 174H196Q180 174 180 190V220',
  'M240 130V158Q240 174 256 174H284Q300 174 300 190V220',
  'M240 130V158Q240 174 256 174H404Q420 174 420 190V220',
] as const;

/**
 * Shows local files, Git, dataset buckets, and hosted storage choices.
 * @returns A storage diagram using the stack illustration's motion and palette.
 * @example
 * <StorageScene />
 */
export function StorageScene() {
  return (
    <InView fallbackInView>
      {({ ref, inView }) => (
        <div
          className="vv-stack-scene vv-storage-scene"
          ref={ref}
          data-motion-visible={inView}
        >
          <svg viewBox="0 0 480 360" aria-hidden="true">
            {STORAGE_CONNECTIONS.map((d, index) => (
              <g key={d}>
                <path className="vv-stack-scene__connection" d={d} />
                <path
                  className="vv-stack-scene__pulse"
                  d={d}
                  pathLength="100"
                  style={{ animationDelay: `${index * -1.4}s` }}
                />
              </g>
            ))}
          </svg>
          <div className="vv-storage-scene__files">
            <div className="vv-storage-scene__file-card vv-hover-shine">
              <div className="vv-storage-scene__file-row">
                <span aria-hidden="true">{'{}'}</span> datasets.json
              </div>
              <div className="vv-storage-scene__file-row">
                <span aria-hidden="true">{'{}'}</span> results.json
              </div>
            </div>
          </div>
          <div className="vv-storage-scene__destinations">
            <div className="vv-storage-scene__destination">
              <div
                className="vv-storage-scene__icon vv-hover-shine"
                aria-hidden="true"
              >
                <svg viewBox="0 0 32 32" fill="none">
                  <path d="M5 8h8l3 4h11v14H5Z" />
                </svg>
              </div>
              <span>Local files</span>
            </div>
            <div className="vv-storage-scene__destination">
              <div
                className="vv-storage-scene__icon vv-hover-shine"
                aria-hidden="true"
              >
                <svg viewBox="0 0 32 32" fill="none">
                  <path d="M10 9v14m12-14v4q0 5-6 5h-6" />
                  <circle cx="10" cy="6" r="3" />
                  <circle cx="10" cy="26" r="3" />
                  <circle cx="22" cy="6" r="3" />
                </svg>
              </div>
              <span>Git repo</span>
            </div>
            <div className="vv-storage-scene__destination">
              <div
                className="vv-storage-scene__icon vv-storage-scene__icon--pair vv-hover-shine"
                aria-hidden="true"
              >
                <img
                  src="/assets/provider-s3.svg"
                  alt=""
                  width="24"
                  height="24"
                />
                <img
                  src="/assets/provider-gcs.svg"
                  alt=""
                  width="24"
                  height="24"
                />
              </div>
              <span>S3 / GCS</span>
              <small>Datasets only</small>
            </div>
            <div className="vv-storage-scene__destination">
              <div
                className="vv-storage-scene__icon vv-storage-scene__icon--pair vv-hover-shine"
                aria-hidden="true"
              >
                <img
                  className="vv-stack-scene__mono"
                  src="/assets/provider-braintrust.svg"
                  alt=""
                  width="24"
                  height="24"
                />
                <img
                  src="/assets/provider-langfuse.svg"
                  alt=""
                  width="24"
                  height="24"
                />
              </div>
              <span>
                Braintrust
                <br />
                Langfuse
              </span>
            </div>
          </div>
        </div>
      )}
    </InView>
  );
}
