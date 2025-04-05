;; Needs Assessment Contract
;; Documents requirements in affected areas

(define-data-var last-need-id uint u0)

;; Need priority levels
(define-constant PRIORITY_LOW u1)
(define-constant PRIORITY_MEDIUM u2)
(define-constant PRIORITY_HIGH u3)
(define-constant PRIORITY_CRITICAL u4)

;; Need status
(define-constant STATUS_OPEN u1)
(define-constant STATUS_IN_PROGRESS u2)
(define-constant STATUS_FULFILLED u3)
(define-constant STATUS_CANCELLED u4)

;; Need data structure
(define-map needs
  { need-id: uint }
  {
    requester: principal,
    resource-type: uint,
    quantity: uint,
    location: (string-utf8 100),
    priority: uint,
    status: uint,
    description: (string-utf8 500),
    created-at: uint,
    last-updated: uint
  }
)

;; Register a new need
(define-public (register-need
  (resource-type uint)
  (quantity uint)
  (location (string-utf8 100))
  (priority uint)
  (description (string-utf8 500))
)
  (let
    (
      (new-id (+ (var-get last-need-id) u1))
    )
    (asserts! (and (>= resource-type u1) (<= resource-type u5)) (err u1))
    (asserts! (> quantity u0) (err u2))
    (asserts! (and (>= priority u1) (<= priority u4)) (err u3))

    (map-set needs
      { need-id: new-id }
      {
        requester: tx-sender,
        resource-type: resource-type,
        quantity: quantity,
        location: location,
        priority: priority,
        status: STATUS_OPEN,
        description: description,
        created-at: block-height,
        last-updated: block-height
      }
    )

    (var-set last-need-id new-id)
    (ok new-id)
  )
)

;; Update need status
(define-public (update-need-status (need-id uint) (new-status uint))
  (let
    (
      (need (unwrap! (map-get? needs { need-id: need-id }) (err u404)))
    )
    (asserts! (is-eq (get requester need) tx-sender) (err u403))
    (asserts! (and (>= new-status u1) (<= new-status u4)) (err u1))

    (map-set needs
      { need-id: need-id }
      (merge need {
        status: new-status,
        last-updated: block-height
      })
    )
    (ok true)
  )
)

;; Update need priority
(define-public (update-need-priority (need-id uint) (new-priority uint))
  (let
    (
      (need (unwrap! (map-get? needs { need-id: need-id }) (err u404)))
    )
    (asserts! (is-eq (get requester need) tx-sender) (err u403))
    (asserts! (and (>= new-priority u1) (<= new-priority u4)) (err u1))

    (map-set needs
      { need-id: need-id }
      (merge need {
        priority: new-priority,
        last-updated: block-height
      })
    )
    (ok true)
  )
)

;; Get need details
(define-read-only (get-need (need-id uint))
  (map-get? needs { need-id: need-id })
)

;; Get the total number of registered needs
(define-read-only (get-need-count)
  (var-get last-need-id)
)
