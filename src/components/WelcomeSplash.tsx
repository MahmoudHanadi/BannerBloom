import React from 'react';
import { ArrowRight, Download, FolderOpen, Shapes, Sparkles } from 'lucide-react';
import { bannerBloomMarkUrl } from '../lib/brandAssets';

interface WelcomeSplashProps {
  onEnterLibrary: () => void;
}

export const WelcomeSplash: React.FC<WelcomeSplashProps> = ({ onEnterLibrary }) => (
  <div
    className="studio-launch-splash fixed inset-0 z-[11000] flex items-center justify-center overflow-hidden px-5 py-6"
    role="dialog"
    aria-modal="true"
    aria-labelledby="bannerbloom-launch-title"
  >
    <div className="studio-launch-splash__orb studio-launch-splash__orb--left" aria-hidden="true" />
    <div className="studio-launch-splash__orb studio-launch-splash__orb--right" aria-hidden="true" />

    <div className="studio-launch-card relative w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/60 bg-white/78 shadow-[0_28px_90px_rgba(15,23,42,0.18)] backdrop-blur-2xl">
      <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(19rem,0.8fr)] lg:gap-10 lg:p-10">
        <div className="relative z-10 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/90 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-emerald-800">
              <Sparkles className="h-3.5 w-3.5" />
              Welcome
            </div>

            <div className="mt-5 flex items-center gap-4">
              <div className="rounded-[1.35rem] bg-gradient-to-br from-emerald-500 to-teal-600 p-3.5 text-white shadow-[0_18px_40px_rgba(14,165,164,0.25)]">
                <img
                  src={bannerBloomMarkUrl}
                  alt="BannerBloom"
                  className="h-12 w-12 rounded-2xl bg-white/20 p-1"
                />
              </div>
              <div>
                <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  BannerBloom
                </div>
                <div className="text-sm font-semibold text-slate-700">
                  Create once. Deploy everywhere.
                </div>
              </div>
            </div>

            <h1
              id="bannerbloom-launch-title"
              className="mt-8 max-w-3xl text-4xl font-black tracking-[-0.04em] text-slate-950 md:text-5xl"
            >
              Start in the library, then open the campaign that matters.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
              Welcome to BannerBloom. Browse saved campaigns, organize folders, or create a
              fresh campaign before you enter the editor.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="studio-launch-chip">
                <FolderOpen className="h-4 w-4" />
                Open saved campaigns
              </span>
              <span className="studio-launch-chip">
                <Shapes className="h-4 w-4" />
                Create new campaign sets
              </span>
              <span className="studio-launch-chip">
                <Download className="h-4 w-4" />
                Export production packages
              </span>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={onEnterLibrary}
              className="studio-button-primary inline-flex items-center gap-2 px-6 py-3 text-base"
            >
              Open campaign library
              <ArrowRight className="h-4 w-4" />
            </button>
            <p className="text-sm text-slate-500">
              Start by opening an existing campaign or creating a new one.
            </p>
          </div>
        </div>

        <div className="relative z-10">
          <div className="studio-launch-panel h-full rounded-[1.6rem] border border-slate-200/70 bg-white/78 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur-xl">
            <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
              First steps
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">Your launch path</div>
            <div className="mt-6 space-y-3">
              <div className="studio-launch-step">
                <span className="studio-launch-step__index">1</span>
                <div>
                  <div className="font-semibold text-slate-900">Open the campaign library</div>
                  <div className="text-sm text-slate-500">
                    Review existing work instead of landing inside a previous campaign.
                  </div>
                </div>
              </div>
              <div className="studio-launch-step">
                <span className="studio-launch-step__index">2</span>
                <div>
                  <div className="font-semibold text-slate-900">Pick or create a campaign</div>
                  <div className="text-sm text-slate-500">
                    Start from a saved campaign or create a new one with a clear name.
                  </div>
                </div>
              </div>
              <div className="studio-launch-step">
                <span className="studio-launch-step__index">3</span>
                <div>
                  <div className="font-semibold text-slate-900">Enter the editor intentionally</div>
                  <div className="text-sm text-slate-500">
                    Design, resize, and export only after you choose the right workspace.
                  </div>
                </div>
              </div>
            </div>

            <div className="studio-launch-note mt-6 rounded-[1.2rem] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
                Default landing
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                BannerBloom now opens through the welcome flow and campaign library instead of
                jumping straight into the last open canvas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
