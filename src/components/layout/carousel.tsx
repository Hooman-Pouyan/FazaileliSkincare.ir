"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { useId, useState } from "react";
import { useLocale } from "next-intl";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Keyboard, Navigation, Pagination } from "swiper/modules";
import type { SwiperOptions } from "swiper/types";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { dirFor } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * The storefront's one carousel. Swiper, styled through the token layer.
 *
 * **One mechanism.** This replaced a hand-rolled scroll-snap rail. Both worked;
 * keeping both would have meant two answers to "how does a row of things
 * scroll", which `AGENTS.md` forbids and which is how a codebase ends up with a
 * different rail on every screen.
 *
 * **What is deliberately not enabled.** No autoplay, ever — `10-design-playbook.md`
 * Step 5 and decision L-3 both refuse it, and Swiper's `Autoplay` module is not
 * even imported so it cannot be switched on by passing a prop. No loop, no
 * effect-cube, no 3D flips. The modules loaded are navigation, pagination,
 * keyboard and a11y: the ones that make it usable, not the ones that make it
 * showy.
 *
 * **Before hydration.** The slides are real children in the server-rendered
 * HTML, and `swiper-wrapper` is a flex row, so an un-initialised carousel is a
 * horizontally scrollable row rather than a stack of overlapping items. The
 * `no-js-scroll` class below supplies that scrolling until Swiper takes over.
 *
 * **RTL** comes from the resolved locale rather than a prop, so no caller can
 * get it wrong.
 */
export function Carousel({
  items,
  label,
  previousLabel,
  nextLabel,
  slidesPerView = { base: 1.15, sm: 2.1, lg: 3.2 },
  showPagination = false,
  className,
  slideClassName,
}: {
  readonly items: readonly ReactNode[];
  readonly label: string;
  readonly previousLabel: string;
  readonly nextLabel: string;
  readonly slidesPerView?: {
    readonly base: number;
    readonly sm?: number;
    readonly lg?: number;
  };
  readonly showPagination?: boolean;
  readonly className?: string;
  readonly slideClassName?: string;
}) {
  const locale = useLocale();
  const isRtl = dirFor(locale) === "rtl";
  const id = useId().replace(/:/g, "");
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(items.length <= 1);

  const breakpoints: SwiperOptions["breakpoints"] = {
    640: { slidesPerView: slidesPerView.sm ?? slidesPerView.base },
    1024: {
      slidesPerView: slidesPerView.lg ?? slidesPerView.sm ?? slidesPerView.base,
    },
  };

  if (items.length === 0) return null;

  return (
    <div className={cn("relative", className)}>
      <Swiper
        // `key` on direction: Swiper reads `dir` at init, and a locale switch
        // remounts rather than leaving the rail scrolling the wrong way.
        key={isRtl ? "rtl" : "ltr"}
        dir={isRtl ? "rtl" : "ltr"}
        modules={[Navigation, Pagination, Keyboard, A11y]}
        slidesPerView={slidesPerView.base}
        breakpoints={breakpoints}
        spaceBetween={24}
        keyboard={{ enabled: true }}
        a11y={{ containerMessage: label }}
        navigation={{
          prevEl: `#prev-${id}`,
          nextEl: `#next-${id}`,
        }}
        pagination={
          showPagination
            ? {
                el: `#dots-${id}`,
                clickable: true,
                bulletClass: "carousel-dot",
                bulletActiveClass: "carousel-dot-active",
              }
            : false
        }
        onSwiper={(swiper) => {
          setAtStart(swiper.isBeginning);
          setAtEnd(swiper.isEnd);
        }}
        onSlideChange={(swiper) => {
          setAtStart(swiper.isBeginning);
          setAtEnd(swiper.isEnd);
        }}
        className="no-js-scroll !overflow-visible"
      >
        {items.map((item, index) => (
          <SwiperSlide key={index} className={cn("h-auto", slideClassName)}>
            {item}
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="mt-8 flex items-center gap-2">
        <CarouselButton
          id={`prev-${id}`}
          label={previousLabel}
          disabled={atStart}
          icon={isRtl ? "end" : "start"}
        />
        <CarouselButton
          id={`next-${id}`}
          label={nextLabel}
          disabled={atEnd}
          icon={isRtl ? "start" : "end"}
        />
        {showPagination && (
          <div id={`dots-${id}`} className="ms-4 flex items-center gap-2" />
        )}
      </div>
    </div>
  );
}

function CarouselButton({
  id,
  label,
  disabled,
  icon,
}: {
  readonly id: string;
  readonly label: string;
  readonly disabled: boolean;
  readonly icon: "start" | "end";
}) {
  const Icon = icon === "start" ? ChevronLeft : ChevronRight;
  return (
    <button
      id={id}
      type="button"
      aria-label={label}
      aria-disabled={disabled}
      className={cn(
        "grid size-11 place-items-center rounded-control border border-[var(--hairline)]",
        "transition-colors duration-[var(--duration)] ease-[var(--easing)]",
        "hover:bg-surface",
        disabled && "opacity-30",
      )}
    >
      <Icon className="size-4" strokeWidth={1.5} aria-hidden />
    </button>
  );
}
