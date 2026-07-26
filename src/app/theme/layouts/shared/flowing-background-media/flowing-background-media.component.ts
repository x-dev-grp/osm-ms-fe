import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  Input,
  OnDestroy,
  ViewChild
} from '@angular/core';

@Component({
  selector: 'app-flowing-background-media',
  standalone: true,
  templateUrl: './flowing-background-media.component.html',
  styleUrls: ['./flowing-background-media.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FlowingBackgroundMediaComponent implements AfterViewInit, OnDestroy {
  /** Looping muted video path. */
  @Input() src = 'assets/media/output.mp4';

  /**
   * Light wash over the video (0–1). Higher = lighter / more opaque cover.
   * Default keeps UI readable while motion stays visible.
   */
  @Input() washOpacity = 0.78;

  /** When true, fades the whole layer out toward the bottom (sidebar top → first menu). */
  @Input()
  set fadeDown(value: boolean) {
    this._fadeDown = value;
  }
  get fadeDown(): boolean {
    return this._fadeDown;
  }

  @HostBinding('class.flowing-bg--fade-down')
  private _fadeDown = false;

  @HostBinding('style.--flowing-wash-opacity')
  get washOpacityCss(): string {
    return String(this.washOpacity);
  }

  @ViewChild('videoEl', { static: true })
  private readonly videoRef!: ElementRef<HTMLVideoElement>;

  private intersectionObserver: IntersectionObserver | null = null;
  private gestureResumeAttached = false;
  private destroyed = false;

  private readonly onCanPlay = () => this.tryPlay();
  private readonly onLoadedData = () => this.tryPlay();
  private readonly onGestureResume = () => {
    this.tryPlay();
    this.detachGestureResume();
  };

  ngAfterViewInit(): void {
    const video = this.videoRef.nativeElement;
    this.prepareAutoplay(video);
    video.addEventListener('canplay', this.onCanPlay);
    video.addEventListener('loadeddata', this.onLoadedData);

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          this.tryPlay();
        }
      },
      { threshold: 0.01 }
    );
    this.intersectionObserver.observe(video);

    this.tryPlay();
    this.attachGestureResume();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    const video = this.videoRef?.nativeElement;
    if (video) {
      video.removeEventListener('canplay', this.onCanPlay);
      video.removeEventListener('loadeddata', this.onLoadedData);
      video.pause();
    }
    this.intersectionObserver?.disconnect();
    this.intersectionObserver = null;
    this.detachGestureResume();
  }

  private prepareAutoplay(video: HTMLVideoElement): void {
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
  }

  private tryPlay(): void {
    if (this.destroyed) {
      return;
    }
    const video = this.videoRef?.nativeElement;
    if (!video || !video.paused) {
      return;
    }
    this.prepareAutoplay(video);
    const playResult = video.play();
    if (playResult !== undefined) {
      playResult.catch(() => this.attachGestureResume());
    }
  }

  private attachGestureResume(): void {
    if (this.gestureResumeAttached || this.destroyed) {
      return;
    }
    this.gestureResumeAttached = true;
    window.addEventListener('pointerdown', this.onGestureResume, { passive: true });
    window.addEventListener('keydown', this.onGestureResume);
  }

  private detachGestureResume(): void {
    if (!this.gestureResumeAttached) {
      return;
    }
    this.gestureResumeAttached = false;
    window.removeEventListener('pointerdown', this.onGestureResume);
    window.removeEventListener('keydown', this.onGestureResume);
  }
}
