css
/* Marquee ticker styles - based on freeCodeCamp infinite scroll pattern */
.marquee {
    --gap: 1rem;
    --duration: 30s;
    position: relative;
    display: flex;
    overflow: hidden;
    user-select: none;
    gap: var(--gap);
}

.marquee__content {
    flex-shrink: 0;
    display: flex;
    justify-content: space-around;
    gap: var(--gap);
    min-width: 100%;
    list-style: none;
    margin: 0;
    padding: 0;
    animation: scroll var(--duration) linear infinite;
}

.marquee__item {
    flex-shrink: 0;
}

@keyframes scroll {
    from {
        transform: translateX(0);
    }
    to {
        transform: translateX(calc(-100% - var(--gap)));
    }
}

/* Pause on hover */
.marquee:hover .marquee__content {
    animation-play-state: paused;
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
    .marquee__content {
        animation-play-state: paused;
    }
}
